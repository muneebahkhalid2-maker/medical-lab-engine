import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import 'express-async-errors';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import extractionRoutes from './routes/extractions';
import analysisRoutes from './routes/analysis';

const app = express();
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// AI Service URL (FastAPI running on Python Engine)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/extractions', extractionRoutes);
app.use('/api/analysis', analysisRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Endpoint to upload multiple documents and call the AI Service
app.post('/api/upload', upload.array('documents', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];

    for (const file of files) {
      const filePath = file.path;
      const docId = path.parse(file.filename).name;

      console.log(`Processing file: ${filePath}`);

      try {
        // Call the FastAPI AI Service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/v1/extract`, {
          file_path: filePath,
          doc_id: docId
        });

        const data = aiResponse.data;
        data.original_image_path = file.filename; 
        results.push(data);
      } catch (err: any) {
        console.error(`Extraction error for ${file.filename}:`, err.message);
        results.push({
          error: true,
          filename: file.filename,
          details: err.response?.data || err.message
        });
      }
    }

    // Return array of results
    res.json(results);
  } catch (error: any) {
    console.error('Server error during extraction:', error.message);
    res.status(500).json({ 
        error: 'Extraction failed.', 
        details: error.message 
    });
  }
});

// Serve uploaded files statically
app.use('/api/uploads', express.static(uploadDir));

// Global error handler
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ 
    success: false, 
    error: { 
      code: 'SERVER_ERROR', 
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    } 
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medextract';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
