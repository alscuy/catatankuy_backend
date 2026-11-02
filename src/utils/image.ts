const ALLOWED_PREFIXES = [
  'data:image/jpeg;base64,',
  'data:image/png;base64,',
  'data:image/webp;base64,',
];

export function validateBase64Image(data: string | null | undefined): { valid: boolean; message?: string } {
  if (!data) return { valid: true };
  if (typeof data !== 'string') return { valid: false, message: 'Format gambar tidak valid' };
  if (data.length > 7 * 1024 * 1024) return { valid: false, message: 'Ukuran gambar terlalu besar (maks ~5MB)' };
  if (!ALLOWED_PREFIXES.some((p) => data.startsWith(p))) {
    return { valid: false, message: 'Format gambar harus JPG, PNG, atau WEBP (base64 data URL)' };
  }
  return { valid: true };
}