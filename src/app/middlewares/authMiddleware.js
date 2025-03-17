const jwt = require('jsonwebtoken');
const User = require('../models/User'); 
const SECRET_CODE = process.env.SECRET_CODE || 'your-secret-key';

class AuthMiddleware {
    // Kiểm tra đăng nhập
    checkLogin(req, res, next) {
        const token = req.cookies?.token;

        if (!token) {
            res.locals.user = null;
            return next();
        }

        try {
            const decoded = jwt.verify(token, SECRET_CODE);
            User.findById(decoded._id)
                .then(user => {
                    if (user) {
                        req.user = user;
                        res.locals.user = user;
                    } else {
                        res.locals.user = null;
                    }
                    next();
                })
                .catch(err => {
                    console.error("Database error:", err.message);
                    res.locals.user = null;
                    next();
                });
        } catch (err) {
            console.error("Invalid token:", err.message);
            res.locals.user = null;
            next();
        }
    }

    // Kiểm tra quyền truy cập
    checkUser(requiredRole) {
        return function (req, res, next) {
            if (!req.user) {
                return res.redirect('/login'); // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
            }

            if (requiredRole && req.user.role !== requiredRole) {
                return res.redirect('/'); // Nếu không có quyền, chuyển hướng về trang chủ
            }

            next();
        };
    }
}

module.exports = AuthMiddleware;
