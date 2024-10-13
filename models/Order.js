const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());

// Define the Order schema
const orderSchema = new mongoose.Schema({
  user: String,
  items: [
    {
      itemName: String,
      option: String,
      quantity: Number,
      price: Number
    }
  ],
  totalPrice: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Order = mongoose.model('Order', orderSchema);
module.exports={Order}
