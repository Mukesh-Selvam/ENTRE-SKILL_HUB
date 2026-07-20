const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const { Schema } = mongoose;

const progressSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roadmap: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true },
  // References the _id of a step subdocument embedded in the Roadmap document.
  step: { type: Schema.Types.ObjectId, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

progressSchema.index({ user: 1, step: 1 }, { unique: true });
toJSONPlugin(progressSchema);

module.exports = mongoose.model('Progress', progressSchema);
