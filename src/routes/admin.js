const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../app/models/User');

const adminController = require('../app/controllers/AdminController');
const dotenv = require('dotenv');
dotenv.config();

const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

// Middleware kiểm tra đăng nhập
var checkLogin = (req, res, next) => {
    var token = req.cookies?.token;
    if (!token) {
        res.locals.user = null; // Không có user, hiển thị nút đăng nhập
        return next();
    }

    try {
        var decoded = jwt.verify(token, SECRET_CODE);
        User.findOne({ _id: decoded._id })
            .then(user => {
                if (user) {
                    req.user = user;
                    res.locals.user = user; // Gửi user vào template
                } else {
                    res.locals.user = null;
                }
                next();
            })
            .catch(err => {
                console.log("Database error:", err.message);
                res.locals.user = null;
                next();
            });
    } catch (err) {
        console.log("Invalid token:", err.message);
        res.locals.user = null;
        next();
    }
};

// Middleware kiểm tra quyền admin
var checkUser = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Nếu là admin, cho phép truy cập
    } else {
        res.redirect('/'); // Không phải admin, về trang chủ
    }
};


router.delete("/admin/transaction/:id", checkLogin, checkUser, adminController.deleteOrder);
router.patch("/admin/transaction/:id/complete", checkLogin, checkUser, adminController.completeOrder);
router.patch("/admin/transaction/:id/confirm", checkLogin, checkUser, adminController.confirmOrder);
router.get("/admin", checkLogin, checkUser, adminController.transaction);






module.exports = router;
