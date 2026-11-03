import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route';
import noteRoutes from './routes/notes.route';
import shareRoutes from './routes/shares.route'; // Import ini wajib ada
import homeRoutes from './routes/home.route';

dotenv.config();
const app = express();
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => res.json({ success: true, message: 'API Running' }));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);          
app.use('/api/shares', shareRoutes); // <-- PASTIKAN INI /api/shares, BUKAN /api/notes
app.use('/api/home', homeRoutes);           

app.use((_req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' }));

export default app;