
const { Schema } = require('mongoose');

// ImageKit image reference.
// url = public image URL
// path = ImageKit fileId (used for deletion)
const imageSchema = new Schema(
  {
    url: {
      type: String,
      default: '',
      maxlength: 600,
    },
    path: {
      type: String,
      default: '',
      maxlength: 300,
    },
  },
  { _id: false }
);

module.exports = { imageSchema };
