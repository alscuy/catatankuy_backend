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

// ANDROID APP LINKS VERIFICATION (https://developer.android.com/training/app-links)
// Firebase autoVerify + assetlinks.json: link https://catatankuy-backend.vercel.app/
// dipercaya masuk langsung ke aplikasi Flutter.
const ASSETLINKS = [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: 'com.example.catatankuy_app',
    sha256_cert_fingerprints: [
      // Debug keystore (flutter run / build debug)
      '37:41:CB:0A:03:77:1D:E5:52:28:17:A2:08:33:B8:1E:14:BC:98:17:60:8B:34:B1:D1:47:37:E4:23:D9:AF:E4',
      // TODO: tambahkan SHA-256 release keystore sebelum rilis Play Store
    ],
  },
}];

app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.set('Content-Type', 'application/json');
  res.json(ASSETLINKS);
});

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);          
app.use('/api/shares', shareRoutes); // <-- PASTIKAN INI /api/shares, BUKAN /api/notes
app.use('/api/home', homeRoutes);           

app.use((_req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' }));

export default app;