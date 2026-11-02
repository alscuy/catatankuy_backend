import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';
let sslConfig: any = undefined;

if (useSSL) {
  const caPath = path.join(__dirname, '..', 'ca.pem');
  if (fs.existsSync(caPath)) {
    sslConfig = { ca: fs.readFileSync(caPath), rejectUnauthorized: true };
  } else {
    console.warn('⚠️ ca.pem tidak ditemukan, SSL tanpa verifikasi CA');
    sslConfig = { rejectUnauthorized: false };
  }
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslConfig,
  timezone: '+07:00',
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}