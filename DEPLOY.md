# 🚀 Panduan Hosting Gratis 100% untuk "WhoAmI"

Aplikasi ini dirancang dengan arsitektur **Single Fullstack Service** (Frontend React/Vite + Backend Realtime Express/Socket.io digabung dalam satu port).  
Artinya, kamu hanya perlu **1 layanan gratis saja** tanpa perlu hosting frontend dan backend secara terpisah!

---

## Opsi 1: Render.com (Paling Populer & Praktis)

1. Buka [render.com](https://render.com) dan login dengan akun GitHub kamu.
2. Klik tombol **New +** -> Pilih **Web Service**.
3. Hubungkan ke repositori kamu: `mhmdilham/WhoAmI`.
4. Isi konfigurasi berikut:
   * **Name:** `whoami-game` (atau nama pilihanmu)
   * **Language:** `Node`
   * **Branch:** `main`
   * **Region:** Singapore (paling cepat untuk Indonesia)
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `node server/index.js`
   * **Instance Type:** `Free`
5. Klik **Create Web Service**.
6. Selesai! Dalam 1-2 menit kamu akan mendapatkan link HTTPS publik (contoh: `https://whoami-game.onrender.com`) yang bisa langsung dibagikan ke teman-teman di Discord!

---

## Opsi 2: Koyeb (Alternatif Bebas Sleep)

1. Buka [koyeb.com](https://www.koyeb.com) dan login dengan GitHub.
2. Buat App baru dari GitHub repo `mhmdilham/WhoAmI`.
3. Build command: `npm run build`
4. Run command: `node server/index.js`
5. Port: `3000`
6. Deploy secara gratis!

---

## Opsi 3: Main Langsung di Tongkrongan (Offline / Tanpa Kuota Internet!)

Jika kamu dan teman-teman sedang nongkrong di kafe/warkop yang terhubung ke WiFi atau Hotspot HP yang sama:

1. Di laptopmu, jalankan:
   ```bash
   npm start
   ```
2. Cek alamat IP lokal laptopmu lewat terminal:
   ```bash
   ipconfig
   # Cari bagian IPv4 Address, misal: 192.168.1.25
   ```
3. Beritahu teman-temanmu untuk membuka alamat ini di browser HP mereka:
   ```
   http://192.168.1.25:3000
   ```
4. Semua pemain bisa langsung bermain bersama secara instan tanpa menguras kuota internet!
