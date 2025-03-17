const express =require('express')
const router = express.Router()

const productController = require('../app/controllers/ProductController')


router.get('/create', productController.create)
router.post('/store', productController.store)
router.get('/:id/edit', productController.edit)
router.put('/:id', productController.update)
router.delete('/:id', productController.delete)

module.exports = router;