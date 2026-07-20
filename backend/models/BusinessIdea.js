const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const { Schema } = mongoose;

const businessIdeaSchema = new Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
  summary: { type: String, default: null },
  category: { type: String, default: null, trim: true },
  lowInvestment: { type: Boolean, default: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  skills: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
  interests: [{ type: Schema.Types.ObjectId, ref: 'Interest' }],
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

toJSONPlugin(businessIdeaSchema);

module.exports = mongoose.model('BusinessIdea', businessIdeaSchema);
