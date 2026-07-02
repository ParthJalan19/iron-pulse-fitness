const mongoose = require('mongoose');

const BmiSchema = new mongoose.Schema({
  height: {
    type: Number,
    required: [true, 'Height is required']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required']
  },
  age: {
    type: Number,
    required: [true, 'Age is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  bmi: {
    type: Number,
    required: [true, 'BMI score is required']
  },
  category: {
    type: String,
    required: [true, 'Category classification is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bmi', BmiSchema);
