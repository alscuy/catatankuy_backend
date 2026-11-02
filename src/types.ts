import { Request } from 'express';

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  avatar_url: string | null;
  created_at: string;
}

export interface NoteRow {
  id: number;
  user_id: number;
  title: string;
  content: string;
  color: string;
  is_pinned: number;
  image_url: string | null; 
  created_at: string;
  updated_at: string;
}

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
  token?: string;
}