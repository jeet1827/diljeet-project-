# Resume Screener

A fully self-hosted, web-based resume screening tool that uses local NLP algorithms to rank resumes against a job description. **No external APIs, no cloud LLMs, no paid services required.**

## Features

- 🚀 **Self-Hosted**: Everything runs locally on your machine
- 📄 **Multi-Format Support**: Accepts PDF, DOCX, and TXT files
- 🧠 **Local NLP**: Uses TF-IDF and keyword matching for scoring
- 💾 **Persistent Storage**: MongoDB stores analysis history
- 🎨 **Beautiful UI**: React-based single-page app (no build step needed)
- 📊 **Detailed Analysis**: Shows matched/missing skills and text excerpts
- 🔒 **Private**: All processing happens on your machine

## Tech Stack

- **Frontend**: React 18 (via CDN), Vanilla CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **File Parsing**: pdf-parse (PDFs), mammoth (DOCX), plain text (TXT)
- **NLP**: natural (TF-IDF, tokenization), compromise (entity extraction)
- **File Upload**: multer (in-memory storage)

## Prerequisites

Before starting, ensure you have:

- **Node.js** (v14 or higher): [Download](https://nodejs.org/)
- **MongoDB** (local instance): [Download](https://www.mongodb.com/try/download/community)

## Installation

### 1. Clone or Download the Project

```bash
cd resume-screener
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages:
- express
- mongoose
- multer
- pdf-parse
- mammoth
- natural
- compromise
- dotenv
- cors

### 3. Start MongoDB

**On Windows:**

```bash
# First time setup (if mongod not installed as service)
mongod --dbpath ./data/db
```

If you have MongoDB installed as a Windows service, it should start automatically. If not, install it:

```bash
# Download from MongoDB community and run the installer
# Or via chocolatey:
choco install mongodb
```

**On macOS:**

```bash
brew services start mongodb-community
```

**On Linux:**

```bash
sudo systemctl start mongod
```

Verify MongoDB is running by opening another terminal and running:

```bash
mongosh  # or 'mongo' for older versions
```

### 4. Start the Server

```bash
npm start
```

You should see output like:

```
Server running at http://localhost:3000
Make sure MongoDB is running: mongod --dbpath ./data/db
```

### 5. Open in Browser

Navigate to **http://localhost:3000** in your web browser.

## Usage

### 1. Upload Job Description

- Drag and drop a job description file (PDF, DOCX, or TXT)
- Or click the upload zone to select a file
- Maximum file size: 5MB

### 2. Upload Resumes

- Upload between 1 and 10 resumes
- Supported formats: PDF, DOCX, TXT
- Maximum 5MB per file
- You can drag and drop multiple files at once

### 3. Analyze

- Click the **"🚀 Analyze Resumes"** button
- Wait for the analysis to complete (usually takes a few seconds)

### 4. Review Results

The app displays resumes ranked by relevance:

- **Score (0-100)**: Combined TF-IDF and keyword match score
- **Matched Skills** (green): Skills found in the resume and required by the job
- **Missing Skills** (red): Required skills not found in the resume
- **Preview**: First 300 characters of the resume text
- **Best Match**: Highlighted with a gold border

### 5. View History

Recent analyses are listed in the left sidebar. Click any previous analysis to view it again.

## How It Works

### Scoring Algorithm

```
final_score = (tfidf_cosine_similarity × 0.6) + (keyword_match_ratio × 0.4)

where:
  tfidf_cosine_similarity = cosine similarity between JD and resume vectors
  keyword_match_ratio = (matched_skills / total_skills) from JD
```

### Components

#### Frontend (`client/index.html`)
- **App**: Main component managing state
- **UploadForm**: Drag-and-drop file uploads
- **ResultsPanel**: Displays ranked resumes with scores
- **HistorySidebar**: Recent analyses

#### Backend

**`server/index.js`**: Express server setup, middleware, static file serving

**`server/config/db.js`**: MongoDB connection

**`server/models/Analysis.js`**: Mongoose schema for storing analysis results

**`server/services/parser.js`**: Extracts text from PDF/DOCX/TXT files

**`server/services/nlp.js`**: 
- Builds TF-IDF model
- Extracts keywords (200+ common tech skills)
- Computes cosine similarity
- Ranks resumes by combined score

**`server/routes/upload.js`**: `POST /api/analyze` endpoint

**`server/routes/history.js`**: 
- `GET /api/history` — returns last 10 analyses
- `GET /api/history/:id` — returns specific analysis

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/analyze` | Upload JD + resumes, get ranked results |
| GET | `/api/history` | List last 10 analyses |
| GET | `/api/history/:id` | Get one analysis by ID |
| GET | `/` | Serve frontend |

### Example POST Request

```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "jd=@job_description.pdf" \
  -F "resumes=@resume1.pdf" \
  -F "resumes=@resume2.pdf"
```

### Response Format

```json
{
  "analysisId": "507f1f77bcf86cd799439011",
  "rankedResumes": [
    {
      "filename": "resume1.pdf",
      "score": 87.5,
      "matched": ["python", "react", "nodejs", "mongodb"],
      "missing": ["kubernetes", "aws"],
      "excerpt": "Senior Full Stack Developer with 5+ years experience..."
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Configuration

### Environment Variables (`.env`)

```env
MONGO_URI=mongodb://localhost:27017/screener
PORT=3000
NODE_ENV=development
```

### File Size Limits

- Job description: 5MB max
- Individual resumes: 5MB max
- Total upload: 50MB max (10 resumes × 5MB)

Modify in `server/index.js`:

```javascript
limits: { fileSize: 5 * 1024 * 1024 } // Change this value
```

## Troubleshooting

### MongoDB Connection Error

**Error**: `MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017`

**Solution**:
1. Ensure MongoDB is running:
   ```bash
   mongod --dbpath ./data/db
   ```
2. Check MongoDB is installed correctly
3. Try connecting directly:
   ```bash
   mongosh
   ```

### File Upload Fails

**Error**: `Unsupported file type` or `Could not extract text`

**Solution**:
1. Ensure file is in PDF, DOCX, or TXT format
2. File is not corrupted
3. File is under 5MB
4. For PDFs, ensure they contain extractable text (not scanned images)

### Port Already in Use

**Error**: `Error: listen EADDRINUSE :::3000`

**Solution**:
1. Kill the process on port 3000:
   - **Windows**: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
   - **macOS/Linux**: `lsof -i :3000` then `kill -9 <PID>`
2. Or change the port in `.env`:
   ```env
   PORT=3001
   ```

### Slow Analysis

**Cause**: Large resume files or many resumes

**Solution**:
- Reduce file count or size
- TF-IDF computation scales with corpus size
- Expected time: 1-5 seconds for typical analysis

## Development

### Project Structure

```
resume-screener/
├── server/
│   ├── index.js                 # Express app entry point
│   ├── config/db.js             # MongoDB connection
│   ├── models/Analysis.js       # Mongoose schema
│   ├── services/
│   │   ├── parser.js            # File text extraction
│   │   └── nlp.js               # TF-IDF, keyword matching
│   └── routes/
│       ├── upload.js            # POST /api/analyze
│       └── history.js           # GET /api/history
├── client/
│   └── index.html               # React app (CDN, no build)
├── package.json
├── .env
└── README.md
```

### Add New Skills to Keyword List

Edit `server/services/nlp.js` and add to `SKILL_KEYWORDS` array:

```javascript
const SKILL_KEYWORDS = [
  // ... existing skills ...
  'your-new-skill-here',
];
```

### Modify Scoring Weights

Edit `server/services/nlp.js`:

```javascript
// Change the weights (currently 60% TF-IDF, 40% keywords)
const combinedScore = (tfidfScore * 0.6) + (keywordMatchRatio * 0.4);
```

## Performance Considerations

- **TF-IDF corpus**: More resumes = slightly longer analysis time
- **MongoDB**: Local instance is fast for <1000 analyses
- **File parsing**: Larger PDF files take longer to extract
- **In-memory storage**: No disk I/O after initial parsing

## Security Notes

- **CORS**: Limited to localhost by default (see `server/index.js`)
- **File uploads**: Only PDF, DOCX, TXT accepted
- **No external calls**: All processing is local
- **Sensitive data**: Store MongoDB on encrypted disk if needed

## Limitations

- No full-text search indexing (MongoDB searches are linear)
- TF-IDF works best with >2-3 documents
- OCR not supported (scanned PDFs won't work)
- Maximum 10 resumes per analysis (easily increased)
- No resume de-duplication detection

## Future Enhancements

- Batch analysis API
- Export results to CSV/JSON
- Custom skill dictionary upload
- Advanced filtering and sorting
- Comparison view for similar candidates
- Resume suggestion tool

## License

MIT

## Support

For issues or questions:
1. Check **Troubleshooting** section above
2. Verify MongoDB is running
3. Check browser console (F12) for client errors
4. Check terminal for server errors

## Author

Resume Screener - Built for local resume screening without external dependencies.

---

**Privacy**: All data stays on your machine. No cloud upload, no external API calls, no tracking.
