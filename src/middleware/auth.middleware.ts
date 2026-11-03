import { Response, NextFunction } from 'express';
import { query } from '../db';
import { verifyToken } from '../utils/jwt';
import { AuthRequest } from '../types';
import wrap from '../utils/handle';

export default wrap(async function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });

  try {
    const revoked = await query('SELECT token FROM revoked_tokens WHERE token = ?', [token]);
    if (revoked.length > 0) return res.status(401).json({ success: false, message: 'Token sudah logout' });

    const payload = verifyToken(token);
    req.user = { id: payload.id, email: payload.email };
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
  }
});