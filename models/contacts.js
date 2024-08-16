const { readData, writeData } = require("../services/dataService");

// List all contacts
const listContacts = async () => {
  try {
    const contacts = await readData();
    return contacts;
  } catch (err) {
    throw new Error("Unable to read contacts");
  }
};

// Get contact by ID
const getContactById = async (contactId) => {
  try {
    const contacts = await readData();
    const contact = contacts.find((c) => c.id === contactId);
    return contact || null;
  } catch (err) {
    throw new Error("Unable to read contacts");
  }
};

// Add a new contact
const addContact = async (body) => {
  try {
    const contacts = await readData();
    const newContact = { id: `${contacts.length + 1}`, ...body };
    contacts.push(newContact);
    await writeData(contacts);
    return newContact;
  } catch (err) {
    throw new Error("Unable to add contact");
  }
};

// Remove contact by ID
const removeContact = async (contactId) => {
  try {
    const contacts = await readData();
    const index = contacts.findIndex((c) => c.id === contactId);
    if (index !== -1) {
      const [removedContact] = contacts.splice(index, 1);
      await writeData(contacts);
      return removedContact;
    }
    return null;
  } catch (err) {
    throw new Error("Unable to remove contact");
  }
};

// Update contact by ID
const updateContact = async (contactId, body) => {
  try {
    const contacts = await readData();
    const index = contacts.findIndex((c) => c.id === contactId);
    if (index !== -1) {
      contacts[index] = { ...contacts[index], ...body };
      await writeData(contacts);
      return contacts[index];
    }
    return null;
  } catch (err) {
    throw new Error("Unable to update contact");
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
