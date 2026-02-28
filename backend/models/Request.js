const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+7\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/, 'Invalid phone format'],
    },
    problem: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model('Request', requestSchema);
