const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slug = require('mongoose-slug-updater')
const mongoosedelte = require('mongoose-delete')

mongoose.plugin(slug)

const User = new Schema({
    username: String,
    email: String,
    password: String,
    phone: String,
    address: String,
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
},{timestamps: true})

User.plugin(mongoosedelte, {deletedAt: true, overrideMethods: true })



module.exports = mongoose.model('User', User);