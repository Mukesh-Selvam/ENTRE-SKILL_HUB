const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const { Schema } = mongoose;

const learningResourceSchema = new Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
  type: { type: String, required: true, enum: ['video', 'article', 'checklist'] },
  url: { type: String, default: null },
  body: { type: String, default: null },
  skill: { type: Schema.Types.ObjectId, ref: 'Skill', default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

toJSONPlugin(learningResourceSchema);

module.exports = mongoose.model('LearningResource', learningResourceSchema);
