# Form Speed Cutting

Aplikasi web untuk input & rekap **speed mesin cutting** beserta **suhu thermocontrol** per mesin. Terintegrasi dengan **Google Sheets** via **Google Apps Script (GAS)** sebagai backend.

---

## Fitur

- **Input Speed + Suhu Dinamis**
  - Speed dalam `pcs/menit`
  - Suhu dalam `°C`
  - Jumlah & label inputbox suhu otomatis menyesuaikan konfigurasi tiap mesin di sheet `Mesin`
    - PT01: 1 suhu (`A`)
    - PT26: 6 suhu (`A1, A2, A3, B1, B2, B3`)
    - PTPM: 6 suhu (`Pisau, Rubber Tube 1, Rubber Tube 2, Tank, Spray Gun 1, Spray Gun 2`)

- **Validasi SPK**
  - No SPK dicek ke database SPK di Google Drive
  - SPK valid kalau:
    - Ditemukan di database, DAN
    - Punya `Panjang Pot` (bukan kosong, bukan `0`); kalau tidak, tampil **"Bukan SPK Potong! Panjang Pot kosong."**
  - Preview notasi SPK: `Jenis [Cetak <Cetakan>] Tebal x Lebar[/Lipat] x PanjangPot        BD BD`
    - Contoh tanpa cetakan: `PP Keunguan 0,08 x 20/12 x 25        BD 17`
    - Contoh dengan cetakan: `PP Keunguan Cetak Ayam Bawang Ungu 0,08 x 20/12 x 25        BD 17`
    - Khusus tebal `0,1` jadi `0,10` dan `0,2` jadi `0,20`
    - `Lipat` tampil (`/lipat`) hanya kalau ada isi & bukan `0`
    - `Cetak <Cetakan>` disisipkan hanya kalau `Cetakan Tambak Rejo` ada isi

- **Rekap Tabel**
  - Filter: tanggal (max 7 hari) + shift (pagi/sore/malam)
  - Baris = mesin (urut sheet), kolom = tanggal x shift
  - Cell speed bisa double click / long press untuk detail lengkap (No SPK, Spesifikasi, Speed, Suhu)
  - Klik nama mesin untuk rekap semua baris mesin tsb dalam rentang aktif
  - Multi-data dalam satu cell ditandai warna kuning

- **Scanner Barcode**
  - Pakai `html5-qrcode` (CDN)
  - Support QR, Code 128/39/93, EAN, UPC, dll
  - Auto-detect kamera belakang

- **Batch Save**
  - Baris baru disimpan dulu di pending (local)
  - Tekan Simpan untuk kirim semua pending sekaligus (`tambahBanyak`)
  - Anti-dobel di backend (cek 200 baris terakhir)

- **Default Tanggal & Shift Otomatis**
  - Tanggal default: hari ini, kecuali jam < 06:00 maka kemarin (cutoff shift pagi)
  - Shift default berdasarkan jam:
    - 06:00 - 13:59: `SHIFT-PAGI`
    - 14:00 - 21:59: `SHIFT-SORE`
    - 22:00 - 05:59: `SHIFT-MALAM`

---

## Struktur Project

    form-speed-cutting/
    |-- index.html                  # SATU-SATUNYA HTML (pintu masuk)
    |
    |-- css/
    |   |-- base.css                # reset, var, bg, header, tab, panel, tombol, toast, sync, rangkuman
    |   |-- form.css                # grid mesin, overlay input SPK/Speed/Suhu, list, confirm
    |   |-- rekap.css               # filter, tabel rekap, overlay info detail
    |   |-- scanner.css             # overlay scanner
    |
    |-- js/
    |   |-- config.js               # CONFIG (GAS_URL, SCANNER, DEFAULT_TAHUN)
    |   |-- scanner.js              # wrapper html5-qrcode
    |   |
    |   |-- core/
    |   |   |-- state.js            # state global + getter/setter
    |   |   |-- util.js             # $, showToast, formatSPKInfo, beep, tanggal, dll
    |   |   |-- gas.js              # callGAS (JSONP), sync overlay
    |   |   |-- summary.js          # ringkasan total baris + rangkuman mesin aktif
    |   |   |-- init.js             # bootstrapper (default tanggal & shift)
    |   |
    |   |-- form/
    |   |   |-- render.js           # render grid mesin
    |   |   |-- list.js             # overlay list per mesin
    |   |   |-- input.js            # overlay input (SPK/Speed/Suhu) + SPK lookup
    |   |   |-- suhu.js             # input suhu dinamis
    |   |   |-- speed.js            # sanitasi input speed
    |   |   |-- crud.js             # OK / Hapus / Simpan batch (payload SPK lengkap)
    |   |   |-- events.js           # bind event tab form + syncData
    |   |
    |   |-- rekap/
    |   |   |-- filter.js           # tanggal + shift filter
    |   |   |-- load.js             # loadRekap
    |   |   |-- render.js           # render tabel
    |   |   |-- detail.js           # detail cell (dengan suhu)
    |   |   |-- rekapMesin.js       # rekap per mesin
    |   |
    |   |-- main.js                 # verifikasi modul + debug helper
    |
    |-- gas/
    |   |-- Code.gs                 # backend Google Apps Script
    |
    |-- README.md                   # file ini

---

## Setup

### 1. Google Sheets

Siapkan Spreadsheet dengan 3 sheet:

#### Sheet Mesin

Header:

    Mesin | Supplier | Suhu 1 | Suhu 2 | Suhu 3 | Suhu 4 | Suhu 5 | Suhu 6

Contoh isi:

    PT01  | Jaya Abadi | A     |         |         |         |         |
    PT26  | Profit     | A1    | A2      | A3      | B1      | B2      | B3
    PTPM  | Yong Chao  | Pisau | Rubber Tube 1 | Rubber Tube 2 | Tank | Spray Gun 1 | Spray Gun 2

- Baris pertama = header
- Baris kedua dst = daftar mesin
- Kolom Suhu = nama thermocontrol (bukan nilai). Kosongkan kalau mesin tidak punya thermocontrol itu.
- Urutan mesin di sini = urutan tampil di web app.

#### Sheet Alamat

Header:

    Tahun | FileID

Contoh isi:

    2026 | 1AbC... (ID file Drive database SPK)

#### Sheet Inputan

Header (19 kolom, A-S):

    ID | Tanggal | Shift | Mesin | No SPK | Jenis | Cetak | Tebal | Lebar | Lipat | Panjang Potong | BD | Speed | Suhu 1 | Suhu 2 | Suhu 3 | Suhu 4 | Suhu 5 | Suhu 6

- Jangan isi manual, diisi otomatis oleh web app.
- Jalankan `migrasiID()` sekali kalau sheet lama belum punya kolom ID.
- Kalau migrasi dari versi lama (header 12 kolom), kosongkan sheet Inputan dulu atau backup, karena posisi kolom bergeser.

### 2. Database SPK di Drive (File ARD)

File teks/CSV (dipisah `%`). Header lengkap (18 kolom):

    No SPK%Cetakan Tambak Rejo%Tanggal Order%Tanggal Kirim%No SO%Pelanggan%Jenis Plastik%Tebal (mm)%Lebar (cm)%Lipat (cm)%Panjang Pot (cm)%Panjang Rol (m)%BD%Berat (kg)%Sudah Diprint%Diserahkan Ke Produksi%Selesai%Batal

Contoh baris:

    12345%Ayam Bawang Ungu%2026-01-01%2026-01-05%SO001%PT ABC%PP Keunguan%0,09%15%5%25%1000%18%25%Sudah%Sudah%Belum%Tidak

Yang dipakai aplikasi:

| Kolom | Dipakai? |
|-------|----------|
| No SPK | Ya |
| Cetakan Tambak Rejo | Ya (tampil di preview) |
| Jenis Plastik | Ya |
| Tebal (mm) | Ya |
| Lebar (cm) | Ya |
| Lipat (cm) | Ya (kondisional) |
| Panjang Pot (cm) | Ya (wajib untuk validasi) |
| BD | Ya |
| Kolom lain | Tidak (diabaikan) |

### 3. Google Apps Script

1. Buka Spreadsheet, lalu Extensions > Apps Script
2. Copy isi `gas/Code.gs` ke `Code.gs` di editor GAS
3. Hapus cache DB SPK (biar baca ulang dengan format baru):
   - Di editor GAS, buat fungsi sementara:

         function clearCache() {
           CacheService.getScriptCache().remove('DB_SPK_CACHE_2026');
         }

   - Klik Run > clearCache, lalu hapus fungsi setelah selesai
4. Deploy > New deployment > Web app
   - Execute as: Me
   - Who has access: Anyone
5. Copy URL `/exec`, tempel di `js/config.js`:

       GAS_URL: 'https://script.google.com/macros/s/.../exec'

### 4. Frontend

#### Opsi A - GitHub Pages / Hosting Statis

Upload semua file (`index.html`, `css/`, `js/`) ke repo / hosting statis. Buka `index.html` di browser.

#### Opsi B - GAS HTML Service

Kalau ingin deploy langsung dari GAS (URL `/exec` yang sama untuk frontend + backend):

- GAS tidak mendukung folder (`css/`, `js/`). Semua file harus flat.
- Perlu build step: gabung semua CSS jadi tag style dan JS jadi script inline di satu `index.html` besar.
- Atau pakai `HtmlService.createTemplateFromFile` + `include()` per file `.html`.

Rekomendasi: gunakan GitHub Pages untuk frontend (Opsi A). Paling simpel dan tetap rapi karena folder `css/` & `js/` dipertahankan.

---

## Debug (di console browser)

    APP.__debug.state()       // ringkasan semua state
    APP.__debug.mesin()       // tabel mesin + supplier + suhuLabels
    APP.__debug.spk()         // total SPK ter-load
    APP.__debug.spk('12345')  // detail SPK tertentu
    APP.__debug.rekap()       // isi rekapRawData

---

## Daftar Action GAS

| Action | Parameter | Return |
|--------|-----------|--------|
| `getMesin` | - | `[namaMesin, ...]` |
| `getMesinDetail` | - | `[{ mesin, supplier, suhuLabels[] }, ...]` |
| `getMasterSPK` | `tahun` | `{ [noSPK]: { ..., cetakan, panjangPot, bd } }` |
| `getData` | `tanggal, shift` | `[{ id, mesin, noSPK, jenis, cetak, tebal, lebar, lipat, panjangPot, bd, speed, suhu[] }, ...]` |
| `getRekap` | `tanggalAwal, tanggalAkhir` | `[{ id, tanggal, mesin, noSPK, ..., speed, suhu[] }, ...]` |
| `tambahData` | `row` (JSON) | `{ id }` |
| `tambahBanyak` | `rows` (JSON array) | `{ jumlah, gagal, duplikat }` |
| `editData` | `id, noSPK, speed, suhu, spk` (JSON) | `{ success }` |
| `hapusData` | `id` | `{ success }` |
| `ping` | - | `{ message: 'pong' }` |

---

## Tema & Warna

Cyberpunk / neon. Warna utama:

| Variabel | Warna | Dipakai untuk |
|----------|-------|---------------|
| `--neon-cyan` | `#00f0ff` | Panel, tombol primary, header tabel |
| `--neon-pink` | `#ff00e0` | Kolom mesin, tombol secondary |
| `--neon-purple` | `#a855f7` | Aksen scanner |
| `--neon-green` | `#39ff14` | Header tabel, tombol success, status sukses |
| `--neon-yellow` | `#ffd700` | Multi-data, tombol edit |
| `--neon-red` | `#ff2e63` | Tombol hapus, error |

---

## Catatan

- Satuan Speed: `pcs/menit`
- Satuan Suhu: `°C`
- Tebal `0,1` jadi `0,10`; tebal `0,2` jadi `0,20` (khusus dua ini, lainnya apa adanya)
- Suhu boleh kosong (mesin mati / tidak punya thermocontrol tertentu)
- Lipat tampil (`/lipat`) hanya kalau ada isi & bukan `0`
- Cetak tampil (`Cetak <isi>`) hanya kalau `Cetakan Tambak Rejo` ada isi
- SPK valid hanya kalau `Panjang Pot` ada isi & bukan `0`
- Rentang tanggal rekap max 7 hari
- Filter rekap: hanya tanggal + shift (tidak ada kategori)
- Tanggal default: hari ini, kecuali jam < 06:00 maka kemarin (cutoff shift pagi)
- Shift default otomatis: 06:00-13:59 Pagi, 14:00-21:59 Sore, 22:00-05:59 Malam

---

## Lisensi

Internal use - PT Mahkota Sukses Makmur.

---

**Author:** Mukhamad Ardiansyah
