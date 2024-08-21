const mongoose = require('mongoose');

const contactMongooseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Set name for contact'],
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  }
}, {
    timestamps:true
});

const Contact = mongoose.model("Contact", contactMongooseSchema);
module.exports = Contact;
