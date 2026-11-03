import { NextFunction, Request, Response } from 'express';

/**
 * Bungkus handler async supaya error dari DB / apapun
 * selalu jawab JSON 500, bukan request gantung (yang di aplikasi
 * terlihat sebagai "Koneksi timeout, coba lagi").
 */
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export default function wrap(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((e: any) => {
      console.error('[ERROR]', e?.sqlMessage || e?.message || e);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server. Coba lagi.' });
      }
    });
  };
}
