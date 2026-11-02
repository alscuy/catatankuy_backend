import { Router } from 'express';
import { query } from '../db';
import auth from '../middleware/auth.middleware';
import { ok, created, fail } from '../utils/response';
import { AuthRequest, NoteRow } from '../types';
import { uploadFileToCloudinary } from '../utils/cloudinary';
import multer from 'multer';
import fs from 'fs';

const router = Router();
router.use(auth);
const upload = multer({ dest: 'uploads/' });

async function getNoteAccess(noteId: number, userId: number) {
  const notes = await query<NoteRow>('SELECT * FROM notes WHERE id = ?', [noteId]);
  const note = notes[0];
  if (!note) return { role: null as 'owner' | 'shared' | null, note: undefined };

  if (note.user_id === userId) return { role: 'owner' as const, note };

  // Cek apakah catatan ini di-share (punya token)
  const share = await query('SELECT id FROM note_shares WHERE note_id = ?', [noteId]);
  if (share.length > 0) return { role: 'shared' as const, note };

  return { role: null as 'owner' | 'shared' | null, note };
}

// GET ALL
router.get('/', async (req: AuthRequest, res) => {
  const rows = await query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.user!.id]);
  return ok(res, rows);
});

// GET DETAIL (Tambahin ini biar Flutter bisa lihat detail)
router.get('/:id', async (req: AuthRequest, res) => {
  const { role, note } = await getNoteAccess(Number(req.params.id), req.user!.id);
  if (!role || !note) return fail(res, 'Catatan tidak ditemukan', 404);
  return ok(res, { ...note, role });
});

// CREATE
router.post('/', upload.single('image'), async (req: AuthRequest, res) => {
  const { title, content, color, is_pinned } = req.body || {};
  if (!title || !content) return fail(res, 'Judul dan isi wajib diisi');

  let imageUrl = null;
  if (req.file) {
    try {
      imageUrl = await uploadFileToCloudinary(req.file.path);
      fs.unlinkSync(req.file.path);
    } catch (error: any) {
      if (req.file) fs.unlinkSync(req.file.path);
      return fail(res, error.message);
    }
  }

  const result: any = await query(
    'INSERT INTO notes (user_id, title, content, color, is_pinned, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user!.id, title, content, color || '#FFF9C4', is_pinned === 'true' ? 1 : 0, imageUrl]
  );
  const note = (await query('SELECT * FROM notes WHERE id = ?', [result.insertId]))[0];
  return created(res, note, 'Catatan dibuat');
});

// DELETE
router.delete('/:id', async (req: AuthRequest, res) => {
  const { role, note } = await getNoteAccess(Number(req.params.id), req.user!.id);
  if (role !== 'owner' || !note) return fail(res, 'Akses ditolak', 404);
  await query('DELETE FROM notes WHERE id = ?', [note.id]);
  return ok(res, null, 'Catatan dihapus');
});

export default router;  