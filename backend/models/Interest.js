const mongoose = require('mongoose');
const toJSONPlugin = require('../utils/toJSONPlugin');

const interestSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

toJSONPlugin(interestSchema);

module.exports = mongoose.model('Interest', interestSchema);
