const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String, default: null, trim: true },
});

toJSONPlugin(skillSchema);

module.exports = mongoose.model('Skill', skillSchema);
