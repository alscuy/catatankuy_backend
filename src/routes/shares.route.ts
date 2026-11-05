import { Router } from 'express';
import { query } from '../db';
import auth from '../middleware/auth.middleware';
import { ok, fail } from '../utils/response';
import wrap from '../utils/handle';
import { renderSharePage } from '../utils/share_page';
import { AuthRequest, NoteRow } from '../types';
import { randomUUID } from 'crypto';
const router = Router()

// ENDPOINT PUBLIC (TANPA LOGIN)
// Content negotiation:
//  - Aplikasi Flutter kirim Accept: application/json -> respons JSON (data catatan)
//  - Link dibuka di Chrome/browser                  -> halaman HTML cantik
//    + tombol & auto-redirect buat nge-buka aplikasi Android
router.get('/public/:token', wrap(async (req, res) => {
  const rows = await query(
    `SELECT n.*, u.name AS owner_name FROM note_shares s
     JOIN notes n ON n.id = s.note_id
     JOIN users u ON u.id = s.owner_id
     WHERE s.share_token = ?`, [req.params.token]
  );

  const wantsJson = String(req.headers.accept || '').includes('application/json');
  if (!wantsJson) {
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.status(rows.length ? 200 : 404).send(renderSharePage(rows[0] ?? null));
  }

  if (rows.length === 0) return fail(res, 'Link tidak valid', 404);
  return ok(res, rows[0]);
}));

// Sisanya butuh login
router.use(auth);

// GET notes yang dibagikan ke saya (via link)
router.get('/shared-with-me', wrap(async (req: AuthRequest, res) => {
  const rows = await query(`
    SELECT n.*, u.name AS owner_name, s.share_token
    FROM notes n
    JOIN users u ON u.id = n.user_id
    JOIN note_shares s ON s.note_id = n.id
    WHERE s.share_token IS NOT NULL
      AND s.owner_id != ?
  `, [req.user!.id]);
  return ok(res, rows);
}));

// GET semua link share yang AKU buat (Untuk lengkapi CRUD)
router.get('/mine', wrap(async (req: AuthRequest, res) => {
  const rows = await query(`
    SELECT s.note_id, s.owner_id, s.share_token, n.title, n.updated_at
    FROM note_shares s
    JOIN notes n ON n.id = s.note_id
    WHERE s.owner_id = ?
    ORDER BY n.updated_at DESC
  `, [req.user!.id]);
  return ok(res, rows);
}));

// CABUT LINK (Untuk lengkapi CRUD)
router.delete('/mine/:noteId', wrap(async (req: AuthRequest, res) => {
  const noteId = Number(req.params.noteId);
  const shares = await query('SELECT * FROM note_shares WHERE note_id = ?', [noteId]);
  const share = shares[0] as any;

  if (!share) return fail(res, 'Catatan ini belum dibagikan', 404);
  if (share.owner_id !== req.user!.id) return fail(res, 'Hanya pemilik yang bisa membatalkan share', 403);

  await query('DELETE FROM note_shares WHERE note_id = ?', [noteId]);
  return ok(res, null, 'Link bagikan dibatalkan');
}));

// GENERATE LINK (Owner only)
const strippedBase = () => (process.env.BASE_URL || 'https://catatankuy-backend.vercel.app').replace(/\/+$/, '');

router.post('/:id/share', wrap(async (req: AuthRequest, res) => {
  const noteId = Number(req.params.id);
  const notes = await query<NoteRow>('SELECT * FROM notes WHERE id = ?', [noteId]);
  const note = notes[0];

  if (!note) return fail(res, 'Catatan tidak ditemukan', 404);
  if (note.user_id !== req.user!.id) return fail(res, 'Hanya pemilik yang bisa share', 403);

  let shareRows = await query('SELECT share_token FROM note_shares WHERE note_id = ?', [noteId]);
  const token = (shareRows[0] as any)?.share_token;

  if (token) {
    // sudah punya link, pakai ulang token lama
    return ok(res, { token, link: `${strippedBase()}/api/shares/public/${token}` }, 'Link berhasil');
  }

  const newToken = randomUUID();
  await query('INSERT INTO note_shares (note_id, owner_id, share_token) VALUES (?, ?, ?)',
    [noteId, req.user!.id, newToken]);
  return ok(res, { token: newToken, link: `${strippedBase()}/api/shares/public/${newToken}` }, 'Link berhasil');
}));

export default router;
