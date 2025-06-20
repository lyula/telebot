const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Group', GroupSchema);