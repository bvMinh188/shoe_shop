const mongoose = require('mongoose')
const Schema = mongoose.Schema
const slug = require('mongoose-slug-updater')
const mongoosedelte = require('mongoose-delete')

const Category = new Schema({
  name: String,
  slug: String,
  description: String,
  products:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ]
});

Category.plugin(mongoosedelte, {deletedAt: true, overrideMethods: true })

module.exports = mongoose.model('Category', Category);