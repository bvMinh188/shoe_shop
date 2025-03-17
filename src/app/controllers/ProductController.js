const Product = require('../models/Product')
const Category = require('../models/Category')
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose')

class ProductController{
    
    show(req, res, next){
        Product.findOne({ slug: req.params.slug })
        .then(product => {
            
            res.render('products/show', { product : mongooseToObject(product) });
        })
        .catch(next);
    }

    create(req, res, next) {
        Category.find({})
            .then(categories => {
                const sizes = [38,39,40,41,42,43,44]
                res.render('products/create', { 
                    sizes : sizes,
                    categories: mutipleMongooseToObject(categories) // Chuyển danh sách categories thành đối tượng bình thường
                });
            })
            .catch(next);
    }
    

    edit(req, res, next) {
        Product.findById(req.params.id)
            .then(product => {
                res.render('products/edit', {
                    product: mongooseToObject(product)
                });
            })
            .catch(next); // Xử lý lỗi nếu xảy ra
    }
    
   
    store(req, res, next) {

        const product = new Product(req.body)
    
        product.save()
            .then(() => {
                res.redirect('/');

            })
            .catch(next);
    }

    update(req, res, next){
        Product.updateOne({_id: req.params.id}, req.body)
            .then(() => res.redirect('/admin/stored/products'))
            .catch(next);

    }

    delete(req, res, next) {
        
        Product.delete({ _id: req.params.id })
            .then(() => {
                res.redirect('back');
            })
            .catch(next);
    }
    
    
    
    
}

module.exports = new ProductController;
