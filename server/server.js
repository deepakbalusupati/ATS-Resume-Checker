require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdf = require('pdf-parse');
const { WordExtractor } = require('docx');
const natural = require('natural');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// File upload config
const storage = multer.memoryStorage();
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/atsresume', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// API Routes
app.get('/', (req, res) => {
  res.send('🚀 ATS Resume Checker API is running');
});

app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  try {
    const { jobDescription } = req.body;
    const resumeFile = req.file;

    if (!resumeFile || !jobDescription) {
      return res.status(400).json({ error: 'Resume file and job description are required' });
    }

    // Extract text from PDF/DOCX
    let resumeText = '';
    if (resumeFile.mimetype === 'application/pdf') {
      const data = await pdf(resumeFile.buffer);
      resumeText = data.text;
    } else if (resumeFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const extractor = new WordExtractor();
      const extracted = await extractor.extract(resumeFile.buffer);
      resumeText = extracted.getBody();
    }

    // Normalize text
    const normalizedResume = resumeText.toLowerCase().replace(/[^\w\s-]/g, '');
    const normalizedJD = jobDescription.toLowerCase().replace(/[^\w\s-]/g, '');

    // Extract keywords using NLP
    const tokenizer = new natural.WordTokenizer();
    const jdTokens = tokenizer.tokenize(normalizedJD);
    const jdKeywords = [...new Set(jdTokens.filter(word => word.length > 3))];

    // Count keyword matches
    const resumeTokens = tokenizer.tokenize(normalizedResume);
    const matches = jdKeywords.filter(keyword => resumeTokens.includes(keyword)).length;

    // Calculate ATS score (0-100)
    const keywordScore = (matches / jdKeywords.length) * 70;
    const formattingScore = 30; // Placeholder for formatting checks
    const totalScore = Math.min(100, keywordScore + formattingScore);

    // Generate feedback
    const missingKeywords = jdKeywords.filter(keyword => !resumeTokens.includes(keyword));

    res.json({
      score: Math.round(totalScore),
      matches,
      totalKeywords: jdKeywords.length,
      missingKeywords: missingKeywords.slice(0, 5),
      suggestions: [
        ...missingKeywords.slice(0, 3).map(kw => `Add keyword: "${kw}"`),
        'Use standard fonts (Arial, Times New Roman)',
        'Replace tables with bullet points for better ATS parsing'
      ]
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
});