const Product = require('../models/Product')
const Category = require('../models/Category')
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { mongooseToObject, mutipleMongooseToObject } = require('../../util/mongoose');


class AdminController {
    
    async transaction(req, res, next) {
        try {
            const orders = await Order.find()
                .populate("userId", "username phone")
                .sort({ createdAt: -1 });
            
            res.render('admin/transaction', { order: mutipleMongooseToObject(orders) });
        } catch (error) {
            next(error);
        }
    }

    // [DELETE] /admin/transaction/:id
    async deleteOrder(req, res, next) {
        try {
            const order = await Order.findByIdAndUpdate(req.params.id, { status: "đã hủy" }, { new: true });
            if (!order) return res.json({ message: "error" });
            
            const updatePromises = order.products.map(product => {
                return Product.updateOne(
                    { name: product.name, "sizes.size": product.size },
                    { $inc: { "sizes.$.quantity": product.quantity } }
                );
            });
            
            await Promise.all(updatePromises);
            res.json({ message: "success" });
        } catch (error) {
            res.json({ message: "error" });
        }
    }

    async confirmOrder(req, res, next) {
        try {
            const order = await Order.findByIdAndUpdate(req.params.id, { status: "đang giao" }, { new: true });
            if (!order) return res.json({ message: "error" });
            res.json({ message: "success" });
        } catch (error) {
            res.json({ message: "error" });
        }
    }

    async completeOrder(req, res, next) {
        try {
            const order = await Order.findByIdAndUpdate(req.params.id, { status: "đã giao" }, { new: true });
            if (!order) return res.json({ message: "error" });
            res.json({ message: "success" });
        } catch (error) {
            res.json({ message: "error" });
        }
    }
}

module.exports = new AdminController();

