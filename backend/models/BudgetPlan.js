const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const { Schema } = mongoose;

const customItemSchema = new Schema({
  label: { type: String, required: true },
  cost: { type: Number, default: 0 },
}, { _id: true });

const budgetPlanSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  idea: { type: Schema.Types.ObjectId, ref: 'BusinessIdea', required: true },
  stepCosts: { type: Map, of: Number, default: {} },
  customItems: [customItemSchema],
}, { timestamps: true });

budgetPlanSchema.index({ user: 1, idea: 1 }, { unique: true });
toJSONPlugin(budgetPlanSchema);

module.exports = mongoose.model('BudgetPlan', budgetPlanSchema);
