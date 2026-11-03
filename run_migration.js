const mysql = require('mysql2/promise');
require('dotenv').config();

const statements = [
  ['DROP FK1 (note_id)', 'ALTER TABLE note_shares DROP FOREIGN KEY note_shares_ibfk_1'],
  ['DROP FK2 (owner_id)', 'ALTER TABLE note_shares DROP FOREIGN KEY note_shares_ibfk_2'],
  ['DROP FK3 (shared_with_user_id)', 'ALTER TABLE note_shares DROP FOREIGN KEY note_shares_ibfk_3'],
  [
    'Ubah kolom + index + FK ulang',
    `ALTER TABLE note_shares
       ADD COLUMN share_token VARCHAR(64) DEFAULT NULL,
       MODIFY shared_with_user_id INT DEFAULT NULL,
       DROP KEY unique_share,
       ADD KEY idx_note_id (note_id),
       ADD KEY idx_owner_id (owner_id),
       ADD KEY idx_shared_with (shared_with_user_id),
       ADD KEY idx_share_token (share_token),
       ADD CONSTRAINT note_shares_ibfk_1 FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
       ADD CONSTRAINT note_shares_ibfk_2 FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE,
       ADD CONSTRAINT note_shares_ibfk_3 FOREIGN KEY (shared_with_user_id) REFERENCES users (id) ON DELETE CASCADE`,
  ],
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    multipleStatements: false,
  });

  for (const [label, sql] of statements) {
    try {
      await conn.query(sql);
      console.log('OK  ' + label);
    } catch (e) {
      console.log('SKIP ' + label + ' -> ' + e.message);
    }
  }

  const [cols] = await conn.query('SHOW CREATE TABLE note_shares');
  console.log(cols[0]['Create Table']);
  await conn.end();
  console.log('SELESAI');
}

main().catch((e) => {
  console.error('Gagal koneksi DB:', e.message);
  process.exit(1);
});
