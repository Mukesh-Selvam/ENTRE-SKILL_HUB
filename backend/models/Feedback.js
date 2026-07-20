const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const { Schema } = mongoose;

const feedbackSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  subject: { type: String, default: null },
  message: { type: String, required: true, minlength: 5, maxlength: 2000 },
  status: { type: String, enum: ['open', 'reviewed', 'resolved'], default: 'open' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

toJSONPlugin(feedbackSchema);

module.exports = mongoose.model('Feedback', feedbackSchema);
