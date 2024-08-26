const express = require("express");
const router = express.Router();
const User = require("../../models/userSchema");
const Joi = require("joi");
const path = require("path");
const fs = require("fs");
const jimp = require("jimp");
const { v4: uuidv4 } = require("uuid");
const transporter = require("../../config/nodemailer");

require("dotenv").config();

const authMiddleware = require("../../middlewares/authMiddleware");
const upload = require("../../config/multerConfig");

const joiSubscriptionSchema = Joi.object({
  subscription: Joi.string().valid("starter", "pro", "business").required(),
});

router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("User already exists");
      return res.status(409).json({
        status: "error",
        code: 409,
        message: "Email in use",
        data: "Conflict",
      });
    }

    const verificationToken = uuidv4();

    const newUser = new User({
      email,
      subscription: "starter",
      verificationToken,
    });

    await newUser.setPassword(password);
    await newUser.save();

    const verifyUrl = `${process.env.BASE_URL}/verify/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Account Registration Confirmation",
      text: "Welcome! Please verify your email address",
      html: `<p>Welcome!</p><p> Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
    };

    try {
      const mailResponse = await transporter.sendMail(mailOptions);
      console.log("Email sent:", mailResponse);

      return res.status(201).json({
        message: "Signup successful, verification email sent",
        user: {
          email: newUser.email,
          subscription: newUser.subscription,
          avatarURL: newUser.avatarURL,
          verify: newUser.verify,
        },
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res.status(500).json({
        message: "Internal Server Error: Unable to send verification email",
      });
    }
  } catch (dbError) {
    console.error("Registration error:", dbError);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/verify/:verificationToken", async (req, res) => {
  const { verificationToken } = req.params;

  try {
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res.status(400).json({ message: "User already verified" });
    }

    user.verify = true;
    delete user.verificationToken;
    await user.save();

    res.status(200).json({ message: "Verification successful" });
  } catch (error) {
    console.error("Error during verification:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/verify", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Missing required field email" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    await user.save();

    const verifyUrl = `${process.env.BASE_URL}/verify/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification",
      text: `Welcome! Please confirm your email address to activate your account. ${verifyUrl}`,
      html: `<p>Welcome!</p>
             <p>It looks like you requested another verification email. Click <a href="${verifyUrl}">here</a> to verify your email address.</p>`,
    };

    try {
      const mailResponse = await transporter.sendMail(mailOptions);
      console.log(mailResponse);

      res.status(200).json({ message: "Verification email sent" });
    } catch (error) {
      console.error("Error during sending verification email:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  } catch (error) {
    console.error("Error during verification process:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        message: "Email or password is wrong",
      });
    }

    if (!user.verify) {
      return res.status(403).json({
        message: "Email not verified",
      });
    }

    const token = user.generateAuthToken();

    user.token = token;
    await user.save();

    res.status(200).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/logout", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    user.token = null;
    await user.save();

    res.status(204).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/", authMiddleware, async (req, res, next) => {
  const { error, value } = joiSubscriptionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { subscription } = value;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.subscription = subscription;
    await user.save();

    res.status(200).json({
      user: {
        email: user.email,
        subscription: user.subscription,
        avatarURL: user.avatarURL,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/avatars",
  authMiddleware,
  upload.single("avatar"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { path: tempPath, originalname } = req.file;
    const userId = req.user._id;

    try {
      const image = await jimp.read(tempPath);
      await image.resize(250, 250).writeAsync(tempPath);

      const fileName = `${userId}_${Date.now()}_${originalname}`;
      const targetPath = path.join(__dirname, "../../public/avatars", fileName);

      fs.rename(tempPath, targetPath, async (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to save image" });
        }

        const avatarURL = `/avatars/${fileName}`;
        const user = await User.findByIdAndUpdate(
          userId,
          { avatarURL },
          { new: true }
        );

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ avatarURL });
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

module.exports = router;
