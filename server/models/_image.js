const { Schema } = require('mongoose');

// An uploaded image. `url` is what the site displays; `path` is the Firebase Storage object path
// (needed to delete the file later).
const imageSchema = new Schema(
  {
    url: { type: String, default: '', maxlength: 600 },
    path: { type: String, default: '', maxlength: 300 },
  },
  { _id: false }
);

module.exports = { imageSchema };
