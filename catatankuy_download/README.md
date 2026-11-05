# catatankuy_download

Folder khusus untuk **file aplikasi Android (APK) CatatanKuy** yang bisa
dilangsungkan dari halaman web ketika ada yang
menjalankan/catatan link share tanpa aplikasi terpasang.

## Bagaimana menggunakannya

1. Build APK dari project Flutter di `catatankuy_app`:

   ```bash
   flutter build apk --release
   ```

2. Salin hasilnya ke sini dengan nama tetap:

   ```bash
   cp ../catatankuy_app/build/app/outputs/flutter-apk/app-release.apk catatankuy.apk
   ```

3. Commit + push &ndash; Vercel otomatis men-deploy filenya dan URL hasilnya:

   ```
   https://catatankuy-backend.vercel.app/catatankuy_download/catatankuy.apk
   ```

Tombol **Download APK (Android)** di landing page share link penunjuk ke URL
tersebut (`src/utils/share_page.ts`).

> Catatan: APK signingnya masih pakai debug keystore &ndash; sama dengan
> fingerprint di `/.well-known/assetlinks.json`, sehingga setelah
> install, link share tetap terbuka langsung ke aplikasi.
> Kalau nanti kalian switch ke release keystore sendiri, jangan lupa
> update SHA-256-nya di `src/server.ts`.
