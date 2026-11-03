import { Router } from 'express';
import { query } from '../db';
import auth from '../middleware/auth.middleware';
import { ok } from '../utils/response';
import wrap from '../utils/handle';
import { AuthRequest } from '../types';

const router = Router();
router.use(auth);

router.get('/summary', wrap(async (req: AuthRequest, res) => {
  const uid = req.user!.id;

  const [totalNotes, totalPinned] = await Promise.all([
    query<{ c: number }>('SELECT COUNT(*) as c FROM notes WHERE user_id = ?', [uid]),
    query<{ c: number }>('SELECT COUNT(*) as c FROM notes WHERE user_id = ? AND is_pinned = 1', [uid]),
  ]);

  // Karena tab Shared sekarang isinya catatan publik (via link), 
  // kita hitung catatan orang lain yang punya link share.
  const totalShared = await query<{ c: number }>(
    `SELECT COUNT(*) as c FROM note_shares s 
     JOIN notes n ON n.id = s.note_id 
     WHERE n.user_id != ?`, 
    [uid]
  );

  const recent = await query(
    'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5',
    [uid]
  );

  return ok(res, {
    total_notes: totalNotes[0].c,
    total_pinned: totalPinned[0].c,
    total_shared_with_me: totalShared[0].c,
    recent_notes: recent,
  });
}));

export default router;