import { Router } from 'express';
import { query } from '../db';
import auth from '../middleware/auth.middleware';
import { ok, created, fail } from '../utils/response';
import wrap from '../utils/handle';
import { AuthRequest, NoteRow } from '../types';
import { uploadBase64ToCloudinary, uploadFileToCloudinary } from '../utils/cloudinary';
import { validateBase64Image } from '../utils/image';
import multer from 'multer';
import fs from 'fs';

const router = Router();
router.use(auth);
// GANTI BARIS INI:
const upload = multer({ dest: '/tmp/' });

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

// Terima true (JSON), 'true' (form), atau 1 supaya "Sematkan" selalu tersimpan
function isPinnedValue(v: any): number {
  return v === true || v === 'true' || v === 1 || v === '1' ? 1 : 0;
}

// GET ALL
router.get('/', wrap(async (req: AuthRequest, res) => {
  const rows = await query('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.user!.id]);
  return ok(res, rows);
}));

// GET DETAIL (Tambahin ini biar Flutter bisa lihat detail)
router.get('/:id', wrap(async (req: AuthRequest, res) => {
  const { role, note } = await getNoteAccess(Number(req.params.id), req.user!.id);
  if (!role || !note) return fail(res, 'Catatan tidak ditemukan', 404);
  return ok(res, { ...note, role });
}));

// CREATE
router.post('/', upload.single('image'), wrap(async (req: AuthRequest, res) => {
  const { title, content, color, is_pinned, image_base64 } = req.body || {};
  if (!title || !content) return fail(res, 'Judul dan isi wajib diisi');

  let imageUrl = null;
  // Flutter kirim gambar jadi base64 di body JSON
  if (image_base64) {
    const v = validateBase64Image(image_base64);
    if (!v.valid) return fail(res, v.message ?? 'Format gambar tidak valid');
    try {
      imageUrl = await uploadBase64ToCloudinary(image_base64);
    } catch (error: any) {
      return fail(res, error.message ?? 'Gagal upload gambar');
    }
  } else if (req.file) {
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
    [req.user!.id, title, content, color || '#FFF9C4', isPinnedValue(is_pinned), imageUrl]
  );
  const note = (await query('SELECT * FROM notes WHERE id = ?', [result.insertId]))[0];
  return created(res, note, 'Catatan dibuat');
}));

// UPDATE (Untuk lengkapi CRUD)
router.put('/:id', wrap(async (req: AuthRequest, res) => {
  const noteId = Number(req.params.id);
  const notes = await query<NoteRow>('SELECT * FROM notes WHERE id = ?', [noteId]);
  const note = notes[0];

  if (!note) return fail(res, 'Catatan tidak ditemukan', 404);
  if (note.user_id !== req.user!.id) return fail(res, 'Hanya pemilik yang bisa mengedit', 403);

  const { title, content, color, is_pinned, image_base64 } = req.body || {};
  if (title !== undefined && !String(title).trim()) return fail(res, 'Judul wajib diisi');
  if (content !== undefined && !String(content).trim()) return fail(res, 'Isi wajib diisi');

  let imageUrl = note.image_url;
  if (image_base64) {
    const v = validateBase64Image(image_base64);
    if (!v.valid) return fail(res, v.message ?? 'Format gambar tidak valid');
    try {
      imageUrl = await uploadBase64ToCloudinary(image_base64);
    } catch (error: any) {
      return fail(res, error.message ?? 'Gagal upload gambar');
    }
  }

  await query(
    'UPDATE notes SET title = ?, content = ?, color = ?, is_pinned = ?, image_url = ? WHERE id = ?',
    [
      title !== undefined ? String(title).trim() : note.title,
      content !== undefined ? String(content) : note.content,
      color ? color : note.color,
      is_pinned === undefined ? note.is_pinned : isPinnedValue(is_pinned),
      imageUrl,
      note.id,
    ]
  );

  const updated = (await query('SELECT * FROM notes WHERE id = ?', [noteId]))[0];
  return ok(res, updated, 'Catatan diperbarui');
}));

// Sematkan/demat cepat (khusus is_pinned)
router.put('/:id/pin', wrap(async (req: AuthRequest, res) => {
  const noteId = Number(req.params.id);
  const notes = await query<NoteRow>('SELECT * FROM notes WHERE id = ?', [noteId]);
  const note = notes[0];

  if (!note) return fail(res, 'Catatan tidak ditemukan', 404);
  if (note.user_id !== req.user!.id) return fail(res, 'Hanya pemilik yang bisa menyematkan', 403);

  const { is_pinned } = req.body || {};
  const pinned = isPinnedValue(is_pinned);
  await query('UPDATE notes SET is_pinned = ? WHERE id = ?', [pinned, note.id]);
  return ok(res, { id: note.id, is_pinned: pinned }, pinned ? 'Catatan disematkan' : 'Sematan dilepas');
}));

// DELETE
router.delete('/:id', wrap(async (req: AuthRequest, res) => {
  const { role, note } = await getNoteAccess(Number(req.params.id), req.user!.id);
  if (role !== 'owner' || !note) return fail(res, 'Akses ditolak', 404);
  await query('DELETE FROM notes WHERE id = ?', [note.id]);
  return ok(res, null, 'Catatan dihapus');
}));

export default router;
