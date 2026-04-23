const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    default: 'Job Description',
  },
  jdText: {
    type: String,
    required: true,
  },
  resumes: [
    {
      filename: String,
      score: Number,
      matched: [String],
      missing: [String],
      excerpt: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
