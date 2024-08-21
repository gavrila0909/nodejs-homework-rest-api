const express = require("express");
const Joi = require("joi");
const Contact = require("../../models/contactsSchema");
const User = require("../../models/userSchema");
const { updateStatusContact } = require("../../models/favoriteContacts");

const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

const joiContactSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(8).required(),
  favorite: Joi.boolean(),
});

router.get("/", authMiddleware, async (req, res, next) => {
  const { page = 1, limit = 20, favorite } = req.query;

  const query = {};
  if (favorite !== undefined) {
    query.favorite = favorite === 'true';
  }

  try {
    const contacts = await Contact.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.status(200).json(contacts);
  } catch (err) {
    next(err);
  }
});

router.get("/:contactId", authMiddleware, async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const contact = await Contact.findById(contactId);
    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    next(err);
  }
});

router.post("/", authMiddleware, async (req, res, next) => {
  const { error, value } = joiContactSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    const newContact = new Contact(value);
    await newContact.save();
    res.status(201).json(newContact);
  } catch (err) {
    next(err);
  }
});

router.delete("/:contactId", authMiddleware, async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const deletedContact = await Contact.findByIdAndDelete(contactId);
    if (deletedContact) {
      res.status(200).json({ message: "Contact deleted" });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    next(err);
  }
});

router.put("/:contactId", authMiddleware, async (req, res, next) => {
  const { contactId } = req.params;
  const { error, value } = joiContactSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    const updatedContact = await Contact.findByIdAndUpdate(contactId, value, {
      new: true,
    });
    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    next(err);
  }
});

router.patch("/:contactId/favorite", authMiddleware, async (req, res, next) => {
  const { contactId } = req.params;
  const { favorite } = req.body;

  if (typeof favorite === "undefined") {
    return res.status(400).json({ message: "missing field favorite" });
  }

  try {
    const updatedContact = await updateStatusContact(contactId, { favorite });
    if (updatedContact) {
      res.status(200).json(updatedContact);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  } catch (err) {
    next(err);
  }
});


module.exports = router;
