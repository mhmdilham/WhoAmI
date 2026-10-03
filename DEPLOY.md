# 🚀 Panduan Deploy Gratis 100% di Vercel (Tanpa Kartu Kredit)

Game **WhoAmI** kini menggunakan arsitektur **WebRTC Peer-to-Peer (PeerJS)**.  
Semua data permainan mengalir langsung antar browser pemain (P2P), sehingga **tidak memerlukan server backend** yang berat atau berbayar.

Aplikasi ini dapat dihosting di **Vercel 100% Gratis Selamanya** tanpa pernah meminta kartu kredit, tanpa batasan tidur (anti-sleep), dan uptime 99.99%!

---

## ⚡ Langkah Deploy di Vercel (Cuma 1 Menit)

1. Buka **[vercel.com](https://vercel.com)** dan klik **Sign Up** atau **Log In**.
2. Pilih **Continue with GitHub** (login langsung pakai akun GitHub kamu).
3. Di Dashboard Vercel, klik tombol **"Add New..."** lalu pilih **"Project"**.
4. Cari repositori kamu: **`mhmdilham/WhoAmI`** lalu klik **"Import"**.
5. Pada bagian konfigurasi:
   - **Framework Preset:** Vite *(sudah otomatis terdeteksi)*
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Klik tombol **"Deploy"** warna biru.
7. Tunggu sekitar 30-45 detik... **SELESAI! 🎉**
8. Vercel akan memberikan link web publik aktif (contoh: `https://whoami-game.vercel.app`).
   - Bagikan link tersebut ke teman-teman di Discord.
   - Siapapun bisa langsung membuat room atau bergabung dari laptop maupun HP!

---

## 💡 Keunggulan Arsitektur Vercel + WebRTC
- **100% Gratis Selamanya:** Vercel gratis tanpa verifikasi kartu kredit.
- **Bebas Sleep (Always On):** Tidak akan pernah "tidur" setelah 5 menit seperti Glitch/Render gratisan.
- **Ultra Low Latency:** Karena koneksi langsung P2P antar-laptop/HP pemain, delay giliran praktis 0ms.
- **Anti-Cheat Tetap Aktif:** Browser Host bertindak sebagai koordinator room yang menyensor kartu masing-masing pemain sebelum dikirim.
