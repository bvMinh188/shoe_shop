const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slug = require('mongoose-slug-updater')
const mongoosedelte = require(  'mongoose-delete')

mongoose.plugin(slug)

const Cart = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    name: String,
    category: String,
    size: Number,
    quantity: Number,
    price: Number,
    image: String,
    slug: { type: String, slug: 'name' }
}, {
    timestamps: true,
    strict: true
});

Cart.plugin(mongoosedelte, { deletedAt: true, overrideMethods: true });

module.exports = mongoose.model('Cart', Cart);
