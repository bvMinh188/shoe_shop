const SiteController = require('../app/controllers/SiteController');
const siteRouter = require('./site');
const adminRouter = require('./admin');
const productsRouter = require('./products');


function route(app){
    
    app.use('/products', productsRouter);
    app.use('/', adminRouter);
    app.use('/', siteRouter);
}

module.exports = route;