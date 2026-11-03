ALTER TABLE note_shares DROP FOREIGN KEY note_shares_ibfk_3;
ALTER TABLE note_shares
  ADD COLUMN share_token VARCHAR(64) DEFAULT NULL,
  MODIFY shared_with_user_id INT DEFAULT NULL,
  DROP KEY unique_share,
  ADD KEY idx_share_token (share_token),
  ADD CONSTRAINT note_shares_ibfk_3 FOREIGN KEY (shared_with_user_id) REFERENCES users (id) ON DELETE CASCADE;
