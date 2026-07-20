const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const { Schema } = mongoose;

const bookmarkSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  idea: { type: Schema.Types.ObjectId, ref: 'BusinessIdea', required: true },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

bookmarkSchema.index({ user: 1, idea: 1 }, { unique: true });
toJSONPlugin(bookmarkSchema);

module.exports = mongoose.model('Bookmark', bookmarkSchema);
