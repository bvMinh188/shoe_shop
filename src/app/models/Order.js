const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slug = require('mongoose-slug-updater')
const mongoosedelte = require('mongoose-delete')

mongoose.plugin(slug)

const Order = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    products:[
        {
            name: String,
            image: String,
            size: Number,
            quantity : Number,
        }

    ],
    price: String,
    address: String,
    status: { type: String, enum: ['chờ xác nhận', 'đang giao', 'đã giao','đã hủy'], default: 'chờ xác nhận' } 
}, {
    timestamps: true,
    strict: true
});

Order.plugin(mongoosedelte, { deletedAt: true, overrideMethods: true });

module.exports = mongoose.model('Order', Order);
