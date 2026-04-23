const express = require('express');
const router = express.Router();
const { parseFile } = require('../services/parser');
const { scoreResumes } = require('../services/nlp');
const Analysis = require('../models/Analysis');

router.post('/analyze', async (req, res) => {
  try {
    // Validate that files are present
    if (!req.files || !req.files.jd || !req.files.resumes) {
      return res.status(400).json({ error: 'Job description and resumes are required' });
    }

    // Validate resume count
    const resumeFiles = Array.isArray(req.files.resumes) ? req.files.resumes : [req.files.resumes];
    if (resumeFiles.length === 0 || resumeFiles.length > 10) {
      return res.status(400).json({ error: 'Please upload between 1 and 10 resumes' });
    }

    // Parse job description
    const jdFile = Array.isArray(req.files.jd) ? req.files.jd[0] : req.files.jd;
    console.log('JD File object keys:', Object.keys(jdFile));
    console.log('JD File:', { originalname: jdFile.originalname, mimetype: jdFile.mimetype, size: jdFile.size });
    const jdText = await parseFile(jdFile.buffer, jdFile.mimetype, jdFile.originalname);

    if (!jdText || jdText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from job description' });
    }

    // Parse resumes
    const resumeTexts = [];
    const filenames = [];
    
    for (const resumeFile of resumeFiles) {
      const resumeText = await parseFile(resumeFile.buffer, resumeFile.mimetype, resumeFile.originalname);
      if (resumeText && resumeText.trim().length > 0) {
        resumeTexts.push(resumeText);
        filenames.push(resumeFile.originalname);
      }
    }

    if (resumeTexts.length === 0) {
      return res.status(400).json({ error: 'Could not extract text from any resumes' });
    }

    console.log(`Processing ${filenames.length} resumes against job description`);

    // Score resumes using NLP
    const rankedResumes = scoreResumes(jdText, resumeTexts, filenames);

    // Save to MongoDB
    const analysis = new Analysis({
      jobTitle: req.body.jobTitle || 'Job Description',
      jdText: jdText,
      resumes: rankedResumes.map(r => ({
        filename: r.filename,
        score: r.score,
        matched: r.matched,
        missing: r.missing,
        excerpt: r.excerpt,
      })),
    });

    await analysis.save();

    // Return results
    res.json({
      analysisId: analysis._id,
      rankedResumes: rankedResumes.map(r => ({
        filename: r.filename,
        score: r.score,
        matched: r.matched,
        missing: r.missing,
        excerpt: r.excerpt,
      })),
      timestamp: analysis.createdAt,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

module.exports = router;
