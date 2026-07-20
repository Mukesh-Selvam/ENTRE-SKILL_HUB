const mongoose = require('mongoose');

const { Schema } = mongoose;

// Each step is a subdocument so it gets its own stable _id (used by /progress routes)
// without needing a separate top-level collection.
const stepSchema = new Schema({
  stepOrder: { type: Number, required: true },
  stage: {
    type: String,
    required: true,
    enum: ['idea_validation', 'skills_tools', 'legal_registration', 'cost_estimation', 'marketing_basics'],
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  estCostMin: { type: Number, default: null },
  estCostMax: { type: Number, default: null },
});

const roadmapSchema = new Schema({
  idea: { type: Schema.Types.ObjectId, ref: 'BusinessIdea', required: true, unique: true },
  title: { type: String, required: true },
  steps: [stepSchema],
});

function transformStep(step) {
  return {
    id: step._id.toString(),
    step_order: step.stepOrder,
    stage: step.stage,
    title: step.title,
    content: step.content,
    est_cost_min: step.estCostMin,
    est_cost_max: step.estCostMax,
  };
}

roadmapSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    if (Array.isArray(ret.steps)) {
      ret.steps = ret.steps
        .map((s) => transformStep(s))
        .sort((a, b) => a.step_order - b.step_order);
    }
    return ret;
  },
});

roadmapSchema.statics.transformStep = transformStep;

module.exports = mongoose.model('Roadmap', roadmapSchema);
