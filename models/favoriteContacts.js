const Contact = require("./contactsSchema");

async function updateStatusContact(contactId, { favorite }) {
  try {
    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }
    contact.favorite = favorite;
    await contact.save();
    return contact;
  } catch (error) {
    throw new Error(`Failed to update contact status: ${error.message}`);
  }
};

module.exports = { updateStatusContact };
