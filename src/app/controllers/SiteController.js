const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User')
const order = require('../models/Order')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()

const axios = require('axios');


const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose')
const { error } = require('console');
const { json } = require('express');
const Order = require('../models/Order');

class SiteController {
    
    //[post] /logined
    logined(req, res, next) {
        const { email, password } = req.body;
    
        User.findOne({ email: email })
            .then(userByEmail => {
                if (!userByEmail) {
                    return res.json({ message: 'tài khoản không tồn tại' });
                }
    
                // So sánh mật khẩu đã nhập với mật khẩu trong cơ sở dữ liệu
                bcrypt.compare(password, userByEmail.password)
                    .then(isMatch => {
                        if (isMatch) {
                            // Nếu mật khẩu đúng
                            const token = jwt.sign({ _id: userByEmail._id }, SECRET_CODE);
                            return res.json({ message: userByEmail.role, token: token });
                        } else {
                            // Nếu mật khẩu sai
                            return res.json({ message: 'sai mật khẩu' });
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        return res.status(500).json({ message: 'đã xảy ra lỗi' });
                    });
            })
            .catch(error => {
                console.error(error);
                return res.status(500).json({ message: 'đã xảy ra lỗi' });
            });
    }
    
         
    //[Get] /
    index(req, res, next) {
        let page = parseInt(req.query.page) || 1; // Trang hiện tại
        let limit = 12; // Số sản phẩm mỗi trang
        let skip = (page - 1) * limit; // Số sản phẩm cần bỏ qua
    
        let filter = {}; // Object để lọc dữ liệu
    
        // Nếu có query `category`, thêm điều kiện lọc
        if (req.query.category) {
            filter.category = req.query.category;
        }
    
        let productQuery = Product.find(filter); // Lọc theo danh mục nếu có
    
        // Kiểm tra có yêu cầu sắp xếp giá không
        if (req.query._sort) {
            productQuery = productQuery.sort({ price: req.query._sort });
        }
    
        Promise.all([
            productQuery.skip(skip).limit(limit), // Lấy sản phẩm theo trang đã lọc
            Product.countDocuments(filter), // Đếm tổng số sản phẩm sau khi lọc
            Product.distinct("category") // Lấy danh sách danh mục duy nhất
        ])
        .then(([products, totalProducts, categories]) => {
            const totalPages = Math.ceil(totalProducts / limit); // Tổng số trang sau khi lọc
    
            res.render('home', {
                categories: categories, // Danh mục cho filter
                products: mutipleMongooseToObject(products), // Sản phẩm sau khi lọc
                currentPage: page,
                totalPages: totalPages,
                selectedCategory: req.query.category || null, // Giữ danh mục được chọn
            });
        })
        .catch(next);
    }
    
    


    //[Get] /:slug
    showProduct(req, res, next) {
        const slug = req.params.slug;
        Product.findOne({ slug: slug }).lean()
            .then((product) => {
                if (!product) {
                    console.error(`Không tìm thấy sản phẩm với slug: ${slug}`);
                    return res.status(404).render('errors/404', { message: "Không tìm thấy sản phẩm." });
                }
                res.render('products/show', {
                                product: product,
                            });
            })
            .catch((err) => {
                console.error("Lỗi khi truy vấn sản phẩm:", err);
                next(err);
            });
    }
    
    
     

    //[Post] /order/:id
    addProductCart(req, res, next) {
        const quantity = parseInt(req.body.quantity, 10);
        const size = parseInt(req.body.size, 10);
        const id = req.params.id;
        var token = req.cookies.token;
    
        if (!token) {
            return res.status(401).json({ message: 'Bạn cần đăng nhập để thêm vào giỏ hàng' });
        }
    
        try {
            var decodeToken = jwt.verify(token, SECRET_CODE);
    
            Product.findOne({ _id: id })
                .then(product => {
                    if (!product) {
                        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
                    }
    
                    const sizeInfo = product.sizes.find(s => parseInt(s.size, 10) === size);
                    if (!sizeInfo) {
                        return res.status(400).json({ message: 'Không tìm thấy size' });
                    }
    
                    // Kiểm tra số lượng có đủ hay không
                    if (quantity > sizeInfo.quantity) {
                        return res.status(400).json({ message: 'Số lượng không đủ' });
                    }
    
                    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
                    Cart.findOne({ userId: decodeToken._id, name: product.name, size: size })
                        .then(existingProduct => {
                            if (existingProduct) {
                                // Kiểm tra nếu tổng số lượng mới vượt quá số lượng hàng tồn kho
                                if (existingProduct.quantity + quantity > sizeInfo.quantity) {
                                    return res.status(400).json({ message: 'Không thể thêm quá số lượng còn lại' });
                                }
    
                                return Cart.findOneAndUpdate(
                                    { _id: existingProduct._id },
                                    { $inc: { quantity: quantity } },
                                    { new: true }
                                ).then(() => res.json({ message: 'Cập nhật giỏ hàng thành công' }));
                            } else {
                                const newCart = new Cart({
                                    userId: decodeToken._id,
                                    name: product.name,
                                    image: product.image,
                                    price: product.price,
                                    category: product.category,
                                    size: size,
                                    quantity: quantity
                                });
    
                                return newCart.save().then(() => res.json({ message: 'Thêm thành công' }));
                            }
                        })
                        .catch(next);
                })
                .catch(next);
        } catch (err) {
            res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ' });
        }
    }
    
    
    
    //[Get] /order
    showOrder(req, res, next) {
        const token = req.cookies.token;
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
                User.findById(decodeToken._id)
                    .then(userInfo => {
                        if (!userInfo) {
                            return res.redirect('/login'); // Nếu không tìm thấy user, chuyển hướng về trang đăng nhập
                        }
                        Cart.find({ userId: decodeToken._id })
                            .then(cart => {
                                const array = cart.map(product => {
                                    return product.price * product.quantity
                                });
                                const tong = array.reduce((total, value) => total + value, 0);
                                res.render('user/order', {
                                    userInfo: mongooseToObject(userInfo), // Truyền thông tin người dùng vào view
                                    cart: mutipleMongooseToObject(cart),
                                    tong: tong
                                });
                            })
                            .catch(next);
                    })
                    .catch(next);
            } catch (err) {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
    }
    

    //[Post] /update-order/;id
    updateOrder(req, res, next) {
        const token = req.cookies.token;
        const { quantity } = req.body;
        const id = req.params.id;
    
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
                Cart.findOneAndUpdate(
                    { _id: id },
                    { $set: { quantity: quantity } },
                    { new: true }
                )
                .then(() => res.json({ message: 'Cập nhật giỏ hàng thành công' }))
                .catch(next);
            } catch (err) {
                res.redirect('/login');
            }
        } else {
            res.redirect('/login');
        }
    }
    
    
    
    //[DELETE] /delete-order/;id
    deleteOrder(req, res, next) {
        var token = req.cookies.token;
        const id = req.params.id;
    
        if (token) {
            try {
                var decodeToken = jwt.verify(token, SECRET_CODE);
                Cart.findOneAndDelete({ _id: id })
                    .then(() => {
                        res.json({ message: 'Xóa thành công' });
                    })
                    .catch(next);
            } catch (err) {
                return res.status(403).json({ message: 'Xác thực người dùng không thành công' });
            }
        } else {
            res.redirect('/login');
        }
    }
    

    //[Post] /checkout
    checkout(req, res, next) {
        const { address, price } = req.body;
        const token = req.cookies?.token;
    
        if (!token) return res.redirect('/');
    
        try {
            const decodeToken = jwt.verify(token, SECRET_CODE);
    
            Cart.find({ userId: decodeToken._id }).then(cartItems => {
                if (cartItems.length === 0) {
                    return res.status(400).json({ message: 'Giỏ hàng trống' });
                }
    
                const productChecks = cartItems.map(item => {
                    return Product.findOne({ name: item.name, 'sizes.size': item.size }).then(product => {
                        if (!product) {
                            return { name: item.name, size: item.size, error: 'Sản phẩm không tồn tại' };
                        }
    
                        const sizeInfo = product.sizes.find(s => s.size === item.size);
                        if (!sizeInfo || sizeInfo.quantity < item.quantity) {
                            return { name: item.name, size: item.size, error: `Chỉ còn ${sizeInfo ? sizeInfo.quantity : 0} sản phẩm` };
                        }
    
                        return null; 
                    });
                });
    
                Promise.all(productChecks).then(results => {
                    const errors = results.filter(result => result !== null);
                    if (errors.length > 0) {
                        const errorMessage = errors.map(err => `${err.name} - Size: ${err.size}: ${err.error}`).join("\n");
                        return res.status(400).json({ message: errorMessage });
                    }
                    const productUpdates = cartItems.map(item => {
                        return Product.updateOne(
                            { name: item.name, 'sizes.size': item.size },
                            { $inc: { 'sizes.$.quantity': -item.quantity } }
                        );
                    });
    
                    Promise.all(productUpdates)
                        .then(() => {
                            const newOrder = new Order({
                                userId: decodeToken._id,
                                products: cartItems.map(item => ({
                                    name: item.name,
                                    image: item.image,
                                    size: item.size,
                                    quantity: item.quantity
                                })),
                                address: address,
                                price: price,
                                status: 'chờ xác nhận',
                            });
    
                            return newOrder.save();
                        })
                        .then(order => {
                            return Cart.deleteMany({ userId: decodeToken._id });
                        })
                        .then(() => {
                            res.json({ message: 'success' });
                        })
                        .catch(err => {
                            console.error("Lỗi khi xử lý đặt hàng:", err);
                            res.status(500).json({ message: 'Lỗi khi xử lý đặt hàng' });
                        });
                }).catch(err => {
                    console.error("Lỗi khi kiểm tra sản phẩm:", err);
                    res.status(500).json({ message: 'Lỗi khi kiểm tra sản phẩm' });
                });
            }).catch(err => {
                console.error("Lỗi khi lấy giỏ hàng:", err);
                res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy giỏ hàng' });
            });
        } catch (err) {
            console.error("Lỗi xác thực token:", err);
            res.redirect('/');
        }
    }    
       
    
    purchase(req, res, next) {
        const token = req.cookies.token;
        if (token) {
            try {
                const decodeToken = jwt.verify(token, SECRET_CODE);
                User.findById(decodeToken._id)
                    .then(userInfo => {
                        if (!userInfo) {
                            return res.redirect('/login'); 
                        }
                        Order.find({ userId: decodeToken._id })
                            .sort({ createdAt: -1 }) // Sắp xếp đơn hàng mới nhất trước
                            .then(orders => {
                                res.render('user/purchase', {
                                    userInfo: mongooseToObject(userInfo),
                                    orders: mutipleMongooseToObject(orders),
                                });
                            })
                            .catch(next);
                    })
                    .catch(next);
            } catch (err) {
                res.redirect('/');
            }
        } else {
            res.redirect('/');
        }
    }
    
    
}

module.exports = new SiteController;
