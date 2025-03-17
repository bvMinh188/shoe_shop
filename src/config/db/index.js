const mongoose = require('mongoose');

async function connect(){
    try {
        await mongoose.connect('mongodb://localhost:27017/sport_shop');
        console.log('Connect successfully');
    } catch (error) {
        console.log('Connect failled');
    }
}

module.exports = {connect};