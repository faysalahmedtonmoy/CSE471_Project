import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './lib/mongodb.js';
import { initializeSocket } from './lib/socket.js';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from './controllers/authController.js';
import messageRoutes from './routes/message.js';
import notificationRoutes from './routes/notifications.js';
import conversationRoutes from './routes/conversations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('MONGODB_URI:', process.env.MONGODB_URI); // Debug log

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Routes
app.use('/api/message', authenticateToken, messageRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/conversations', authenticateToken, conversationRoutes);

// File upload endpoint
app.post('/api/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const file = req.files.file;
  const uploadPath = path.join(__dirname, 'uploads', file.name);

  file.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    res.json({
      message: 'File uploaded successfully',
      filename: file.name,
      url: `/uploads/${file.name}`,
      size: file.size,
      mimetype: file.mimetype
    });
  });
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server initialized`);
});