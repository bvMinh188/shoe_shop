const Product = require('../models/Product')
const { mutipleMongooseToObject } = require('../../util/mongoose')

class CartController{
    
    checkouts(req, res, next){
        Product.find({})
            .then(products =>
                res.render('admin/stored-Products',
                    {products : mutipleMongooseToObject(products)}
                )
            )
            .catch(next);        
    }
   
}

module.exports = new CartController;
