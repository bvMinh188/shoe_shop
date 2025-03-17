const path = require("path");
const express = require("express");
const morgan = require("morgan");
const methodOverride = require('method-override');
const handlebars = require("express-handlebars");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');

const route = require('./routes');
const db = require('./config/db');

// Kết nối tới cơ sở dữ liệu
db.connect();

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3000;

const session = require('express-session');
const flash = require('connect-flash');

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

// Truyền các thông báo flash đến tất cả các view
app.use((req, res, next) => {
    res.locals.message = req.flash();
    next();
});


// Thiết lập thư mục tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cookieParser()); 

app.use(methodOverride('_method'));

// HTTP logger
app.use(morgan("combined"));

// Template engine
app.engine("hbs", handlebars.engine({
  extname: '.hbs',
  helpers: {
    // So sánh bằng (==)
    eq: function (a, b) {
      return a === b;
    },
    not: function (a) {
      return !a;
    },
    or: function (a, b) {
      return a || b;
    },
    sum: (a, b) => a + b,
    subtract: (a, b) => a - b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    range: function (start, end) {
      let list = [];
      for (let i = start; i <= end; i++) list.push(i);
      return list;
    },
    // Định dạng giá tiền (VD: 1.000.000 VND)
    formatPrince: (a) => {
      if (a == null) return "Không có giá";  
      return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VND";
    },
    // Tính tổng số lượng từ danh sách sizes
    totalQuantity: function(sizes) {
      return sizes.reduce((total, size) => total + size.quantity, 0);
    },
    // Định dạng ngày tháng theo giờ Việt Nam
    formatDate: function(datetime){
      return new Date(datetime).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
      });
    },
    // Chuyển đối tượng thành chuỗi JSON
    json: function (context) {
      return JSON.stringify(context);
    },
    // Kiểm tra nếu giá trị lớn hơn hoặc bằng ngưỡng (>=)
    ifGreaterOrEqual: function (value, threshold, options) {
      return value >= threshold ? options.fn(this) : options.inverse(this);
    }
  }
}));

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "resources", "views"));

// Khởi tạo route
route(app);

app.listen(PORT, () => console.log(`App listening at http://localhost:${PORT}`));
