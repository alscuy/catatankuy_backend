import { Router } from 'express';
import { query } from '../db';
import auth from '../middleware/auth.middleware';
import { ok, created, fail } from '../utils/response';
import { AuthRequest, NoteRow } from '../types';
import { v4 as uuidv4 } from 'uuid';

const router = Router()

// ENDPOINT PUBLIC (TANPA LOGIN)
router.get('/public/:token', async (req, res) => {
  const rows = await query(
    `SELECT n.*, u.name AS owner_name FROM note_shares s
     JOIN notes n ON n.id = s.note_id
     JOIN users u ON u.id = s.owner_id
     WHERE s.share_token = ?`, [req.params.token]
  );
  if (rows.length === 0) return fail(res, 'Link tidak valid', 404);
  return ok(res, rows[0]);
});

// Sisanya butuh login
router.use(auth);

// GET notes yang dibagikan ke saya (via link)
router.get('/shared-with-me', async (req: AuthRequest, res) => {
  const rows = await query(`
    SELECT n.*, u.name AS owner_name, s.share_token 
    FROM notes n 
    JOIN users u ON u.id = n.user_id
    JOIN note_shares s ON s.note_id = n.id
    WHERE n.user_id != ?
  `, [req.user!.id]);
  return ok(res, rows);
});

// GENERATE LINK (Owner only)
router.post('/:id/share', async (req: AuthRequest, res) => {
  const noteId = Number(req.params.id);
  const notes = await query<NoteRow>('SELECT * FROM notes WHERE id = ?', [noteId]);
  const note = notes[0];
  
  if (!note) return fail(res, 'Catatan tidak ditemukan', 404);
  if (note.user_id !== req.user!.id) return fail(res, 'Hanya pemilik yang bisa share', 403);

  let shareRows = await query('SELECT share_token FROM note_shares WHERE note_id = ?', [noteId]);
  let token = '';
  
  if (shareRows.length > 0) {
    token = (shareRows[0] as any).share_token;
  } else {
    token = uuidv4();
    await query('INSERT INTO note_shares (note_id, owner_id, share_token) VALUES (?, ?, ?)', 
      [noteId, req.user!.id, token]);
  }

  return ok(res, { token, link: `http://localhost:5000/api/shares/public/${token}` }, 'Link berhasil');
});

export default router;