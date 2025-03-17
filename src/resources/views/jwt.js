const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const SECRET_CODE = process.env.SECRET_CODE || 'Minh';

// Hàm tạo token đặt lại mật khẩu
const generateResetToken = (userId) => {
    return jwt.sign({ id: userId }, SECRET_CODE, { expiresIn: '30m' });
};

module.exports = {
    generateResetToken,
};
