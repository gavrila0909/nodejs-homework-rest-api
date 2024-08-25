const express = require("express");
const router = express.Router();
const User = require("../../models/userSchema");
const Joi = require("joi");
const path = require("path");
const fs = require("fs");
const jimp = require("jimp");

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
      return res.status(409).json({
        status: "error",
        code: 409,
        message: "Email in use",
        data: "Conflict",
      });
    }

    const newUser = new User({
      email,
      subscription: "starter",
    });

    await newUser.setPassword(password);

    await newUser.save();

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
      },
    });
  } catch (error) {
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
