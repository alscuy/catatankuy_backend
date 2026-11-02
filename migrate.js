const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: { rejectUnauthorized: false } 
    });

    console.log('Menghapus kolom image_base64...');
    try {
      await connection.query('ALTER TABLE notes DROP COLUMN image_base64;');
    } catch (e) {
      console.log('Info: Kolom image_base64 mungkin sudah tidak ada.');
    }

    console.log('Menambahkan kolom image_url...');
    try {
      await connection.query('ALTER TABLE notes ADD COLUMN image_url VARCHAR(500) DEFAULT NULL;');
    } catch (e) {
      console.log('Info: Kolom image_url mungkin sudah ada.');
    }
    
    console.log('✅ Perubahan tabel notes berhasil!');
    await connection.end();
  } catch (err) {
    console.error('❌ Gagal migrate:', err.message);
  }
}

run();