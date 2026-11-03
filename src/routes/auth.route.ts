import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import auth from '../middleware/auth.middleware';
import { signToken } from '../utils/jwt';
import { ok, created, fail } from '../utils/response';
import { AuthRequest, UserRow } from '../types';
import multer from 'multer';
import { uploadFileToCloudinary } from '../utils/cloudinary';
import fs from 'fs';

const router = Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// GANTI BARIS INI:
const uploadProfile = multer({ dest: '/tmp/' }); 

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return fail(res, 'Nama, email, dan password wajib diisi');
  if (String(password).length < 6) return fail(res, 'Password minimal 6 karakter');
  if (!emailRegex.test(email)) return fail(res, 'Format email tidak valid');

  const exists = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (exists.length > 0) return fail(res, 'Email sudah terdaftar', 409);

  const hash = bcrypt.hashSync(password, 10);
  const result: any = await query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
    name.trim(), email.toLowerCase(), hash,
  ]);

  const rows = await query('SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?', [result.insertId]);
  const user = rows[0];
  
  return created(res, { user, token: signToken({ id: user.id, email: user.email }) }, 'Registrasi berhasil');
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return fail(res, 'Email dan password wajib diisi');

  const rows = await query<UserRow>('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return fail(res, 'Email atau password salah', 401);
  }
  
  return ok(res, {
    user: { id: user.id, name: user.name, email: user.email, avatar_url: user.avatar_url },
    token: signToken({ id: user.id, email: user.email }),
  }, 'Login berhasil');
});

// LOGOUT
router.post('/logout', auth, async (req: AuthRequest, res) => {
  await query('INSERT IGNORE INTO revoked_tokens (token) VALUES (?)', [req.token]);
  return ok(res, null, 'Logout berhasil');
});

// GET PROFILE
router.get('/me', auth, async (req: AuthRequest, res) => {
  const rows = await query('SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?', [req.user!.id]);
  if (rows.length === 0) return fail(res, 'User tidak ditemukan', 404);
  return ok(res, rows[0]);
});

// UPDATE PROFILE (Nama & Avatar)
router.put('/profile', auth, uploadProfile.single('avatar'), async (req: AuthRequest, res) => {
  const { name } = req.body || {};
  let avatarUrl = null;

  if (req.file) {
    try {
      avatarUrl = await uploadFileToCloudinary(req.file.path);
      fs.unlinkSync(req.file.path);
    } catch (error: any) {
      if (req.file) fs.unlinkSync(req.file.path);
      return fail(res, error.message);
    }
  }

  if (name) await query('UPDATE users SET name = ? WHERE id = ?', [name, req.user!.id]);
  if (avatarUrl) await query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user!.id]);

  const user = (await query('SELECT id, name, email, avatar_url FROM users WHERE id = ?', [req.user!.id]))[0];
  return ok(res, user, 'Profil diperbarui');
});

// GANTI PASSWORD
router.put('/password', auth, async (req: AuthRequest, res) => {
  const { old_password, new_password } = req.body || {};
  if (!old_password || !new_password) return fail(res, 'Password lama dan baru wajib diisi');
  if (String(new_password).length < 6) return fail(res, 'Password baru minimal 6 karakter');

  const rows = await query<UserRow>('SELECT * FROM users WHERE id = ?', [req.user!.id]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(old_password, user.password)) return fail(res, 'Password lama salah', 401);

  await query('UPDATE users SET password = ? WHERE id = ?', [bcrypt.hashSync(new_password, 10), req.user!.id]);
  return ok(res, null, 'Password berhasil diubah');
});

export default router;