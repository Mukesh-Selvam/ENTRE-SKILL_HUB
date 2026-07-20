const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const { Schema } = mongoose;

const mentorSessionSchema = new Schema({
  mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mentee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, default: null },
  message: { type: String, required: true, minlength: 5, maxlength: 1000 },
  status: { type: String, enum: ['requested', 'accepted', 'completed', 'declined'], default: 'requested' },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

toJSONPlugin(mentorSessionSchema);

module.exports = mongoose.model('MentorSession', mentorSessionSchema);
