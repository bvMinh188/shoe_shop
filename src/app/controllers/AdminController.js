const Product = require('../models/Product')
const Category = require('../models/Category')
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');


class AdminController{

    //[Get] /admin/transaction
    transaction(req, res, next) {
        Order.find()
            .populate("userId", "username phone")
            .sort({ createdAt: -1 }) // Sắp xếp giảm dần theo createdAt (mới nhất trước)
            .then(order => {
                res.render('admin/transaction', { order: mutipleMongooseToObject(order) });
            })
            .catch(next);
    }
    

    //[DELETE] /admin/transaction/:id
    deleteOrder(req, res, next) {
        Order.findByIdAndUpdate(req.params.id, { status: "đã hủy" })
            .then((order) => {
                // Cập nhật lại số lượng tồn kho cho từng sản phẩm trong đơn hàng
                const updatePromises = order.products.map((product) => {
                    return Product.updateOne(
                        { name: product.name, "sizes.size": product.size },
                        { $inc: { "sizes.$.quantity": product.quantity } }
                    );
                });
                
                // Chờ tất cả các cập nhật hoàn thành
                return Promise.all(updatePromises);
            })
            .then(() => {
                res.redirect('back');
            })
            .catch(next);
    }

    //[patch] /admin/transaction/:id/confirm
    confirmOrder(req, res, next){
        Order.findByIdAndUpdate(req.params.id, { status: "đang giao" })
            .then(() => res.redirect('back'))
            .catch(next)

    }
    completeOrder(req, res, next){
        Order.findByIdAndUpdate(req.params.id, { status: "đã giao" })
            .then(() => res.redirect('back'))
            .catch(next)

    }
}
   


module.exports = new AdminController;
