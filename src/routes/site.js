const express =require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../app/models/User')
const siteController = require('../app/controllers/SiteController')
// const AuthMiddleware = require('../app/middlewares/authMiddleware')
const dotenv = require('dotenv')
dotenv.config()


const SECRET_CODE = process.env.SECRET_CODE || 'Minh';



var checkLogin = async (req, res, next) => {
    try {
        var token = req.cookies?.token;
        
        if (!token) {
            res.locals.user = null;
            return next();
        }

        var decoded = jwt.verify(token, SECRET_CODE);
        let user = await User.findById(decoded._id).lean(); // Chuyển thành object

        if (!user) {
            console.log("User không tồn tại trong DB.");
            res.locals.user = null;
            return next();
        }

        req.user = user;
        res.locals.user = user; // Gửi user vào template

    } catch (err) {
        console.error("Lỗi xác thực JWT:", err.message);
        res.locals.user = null;
    }

    next();
};




var checkUser = (req, res, next) => {
    if (req.user) {
        var role = req.user.role;
        if (role == 'user') {
            return res.redirect("/");
        } else if (role == 'admin') {
            return res.redirect("/admin");
        }
    }
    next();
};



router.post('/logined', siteController.logined);

router.post('/logout', function(req, res) {
    res.clearCookie('token');
    res.redirect('/');
});

router.post('/order/:id',checkLogin, siteController.addProductCart);
router.get('/order', checkLogin, siteController.showOrder)
router.post('/update-order/:id', checkLogin, siteController.updateOrder)
router.delete('/delete-order/:id', checkLogin, siteController.deleteOrder)
router.post('/checkout', checkLogin, siteController.checkout)
router.get('/purchase', checkLogin, siteController.purchase)

// Áp dụng middleware checkLogin cho tất cả route

router.get('/:slug', checkLogin, siteController.showProduct);
router.get('/', checkLogin, siteController.index);




module.exports = router;