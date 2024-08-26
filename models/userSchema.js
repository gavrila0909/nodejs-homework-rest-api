const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require('jsonwebtoken');


const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  subscription: {
    type: String,
    enum: ["starter", "pro", "business"],
    default: "starter",
  },
  token: {
    type: String,
    default: null,
  },
  avatarURL: {
    type: String,
    default: '',
  },
  verify: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    required: [true, 'Verify token is required'],
  },
});

userSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('email')) {
    const avatarURL = gravatar.url(this.email, {
      s: '200', 
      r: 'pg', 
      d: 'mm'  
    });
    this.avatarURL = avatarURL;
  }
  next();
});

// criptarea parolei
userSchema.methods.setPassword = async function (password) {
  this.password = await bcrypt.hash(password, 10);
};

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAuthToken = function () {
  const payload = { id: this._id };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// userSchema.methods.generateVerificationToken = function() {
//   return crypto.randomBytes(16).toString("hex");
// };

const User = mongoose.model("User", userSchema);

module.exports = User;
