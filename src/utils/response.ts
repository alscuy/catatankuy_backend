import { Response } from 'express';

export const ok = (res: Response, data: any, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const created = (res: Response, data: any, message = 'Created') =>
  ok(res, data, message, 201);

export const fail = (res: Response, message: string, status = 400) =>
  res.status(status).json({ success: false, message });