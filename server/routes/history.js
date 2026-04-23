const express = require('express');
const router = express.Router();
const Analysis = require('../models/Analysis');

router.get('/history', async (req, res) => {
  try {
    const analyses = await Analysis.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id jobTitle createdAt resumes');

    const historyItems = analyses.map(analysis => ({
      id: analysis._id,
      jobTitle: analysis.jobTitle,
      timestamp: analysis.createdAt,
      resumeCount: analysis.resumes.length,
      topScore: analysis.resumes.length > 0 ? analysis.resumes[0].score : 0,
    }));

    res.json(historyItems);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/history/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    res.json({
      id: analysis._id,
      jobTitle: analysis.jobTitle,
      timestamp: analysis.createdAt,
      rankedResumes: analysis.resumes,
    });
  } catch (error) {
    console.error('Analysis fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

module.exports = router;
