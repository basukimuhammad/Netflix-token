# Cookie Parser — Vercel

## Deploy
1. Upload folder project ini ke repository GitHub.
2. Buka https://vercel.com/new
3. Import repository tersebut.
4. Framework Preset: Other.
5. Build Command: kosongkan.
6. Output Directory: `public`.
7. Deploy.

`vercel.json` mengatur serverless API di `/api/parse`.

## Lokal
Gunakan Vercel CLI:
```bash
npm install -g vercel
vercel dev
```

Aplikasi hanya memvalidasi dan membaca nama cookie. Nilai cookie tidak dikembalikan atau disimpan.
