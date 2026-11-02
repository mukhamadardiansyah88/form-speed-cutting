/* ============================================================
   CORE — UTIL
   ============================================================
   Fungsi bantu: DOM, angka, tanggal, format SPK, beep, vibrate.
   Semua diakses lewat window.APP.
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};

  /* ============================================================
     DOM
     ============================================================ */
  function $(id) { return document.getElementById(id); }
  APP.$ = $;

  /* ============================================================
     TOAST
     ============================================================ */
  function showToast(msg, type) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('error', 'success');
    if (type === 'error') t.classList.add('error');
    if (type === 'success') t.classList.add('success');
    t.classList.add('show');

    const prev = APP.getToastTimer();
    if (prev) clearTimeout(prev);
    const timer = setTimeout(function () {
      t.classList.remove('show');
    }, 2800);
    APP.setToastTimer(timer);
  }
  APP.showToast = showToast;

  /* ============================================================
     ANGKA & FORMAT
     ============================================================ */

  /* "12,5" → 12.5 ; "" → null ; "abc" → null */
  function speedKeAngka(str) {
    if (str == null) return null;
    const s = String(str).trim().replace(',', '.');
    if (s === '') return null;
    const n = Number(s);
    return isNaN(n) ? null : n;
  }
  APP.speedKeAngka = speedKeAngka;

  /* 12.5 → "12,5" (untuk tampilan) */
  function numToComma(n) {
    if (n == null) return '';
    return String(n).replace('.', ',');
  }
  APP.numToComma = numToComma;

  /* Format tebal: 0,1 → 0,10 ; 0,2 → 0,20 ; lainnya apa adanya */
  function formatTebal(tebal) {
    if (tebal == null) return '';
    const s = String(tebal).trim();
    if (s === '') return '';
    if (s === '0,1') return '0,10';
    if (s === '0,2') return '0,20';
    return s;
  }
  APP.formatTebal = formatTebal;

  /* ============================================================
     FORMAT SPK — NOTASI BARU CUTTING
     ============================================================
     Format:
       <Jenis> <Tebal> x <Lebar> x <PanjangPot>    BD <BD>

     Contoh:
       "PP Keunguan 0,09 x 15 x 25    BD 18"

     Aturan:
     - Tebal 0,1 → tampil 0,10 ; 0,2 → tampil 0,20 ; lainnya apa adanya
     - Kalau PanjangPot kosong → tampilkan "—" di posisi itu? TIDAK.
       Kita tetap tampilkan format lengkap supaya user tahu ada yang kosong.
     - Kalau BD kosong → tampil "BD —"
     ============================================================ */
  function formatSPKInfo(d) {
    if (!d) return '—';

    const jenis = (d.jenisPlastik || '').trim() || '—';
    const tebal = formatTebal(d.tebal) || '—';
    const lebar = (d.lebar || '').trim() || '—';
    const panjangPot = (d.panjangPot || '').trim() || '—';
    const bd = (d.bd || '').trim() || '—';

    return jenis + ' ' + tebal + ' x ' + lebar + ' x ' + panjangPot + '    BD ' + bd;
  }
  APP.formatSPKInfo = formatSPKInfo;

  /* ============================================================
     TANGGAL
     ============================================================ */

  /* Date → "yyyy-mm-dd" */
  function ymd(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  APP.ymd = ymd;

  /* "yyyy-mm-dd" → Date */
  function ymdToDate(ymdStr) {
    const parts = String(ymdStr).split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  APP.ymdToDate = ymdToDate;

  /* "yyyy-mm-dd" → "dd-mm-yy" */
  function ymdToDDMMYY(ymdStr) {
    if (!ymdStr || ymdStr.length < 10) return ymdStr;
    return ymdStr.substring(8, 10) + '-' + ymdStr.substring(5, 7) + '-' + ymdStr.substring(2, 4);
  }
  APP.ymdToDDMMYY = ymdToDDMMYY;

  /* "yyyy-mm-dd" → "dd/mm/yyyy" (locale id-ID) */
  function ymdToLocale(ymdStr) {
    if (!ymdStr || ymdStr.length < 10) return ymdStr;
    try { return ymdToDate(ymdStr).toLocaleDateString('id-ID'); }
    catch (e) { return ymdStr; }
  }
  APP.ymdToLocale = ymdToLocale;

  /* "yyyy-mm-dd" + n hari → "yyyy-mm-dd" */
  function addDays(ymdStr, n) {
    const d = ymdToDate(ymdStr);
    d.setDate(d.getDate() + n);
    return ymd(d);
  }
  APP.addDays = addDays;

  /* Ambil tanggal & shift dari kontrol */
  function getTanggalShift() {
    const t = $('tanggal');
    const s = $('shift');
    return {
      tanggal: t ? t.value : '',
      shift: s ? s.value : ''
    };
  }
  APP.getTanggalShift = getTanggalShift;

  /* ============================================================
     VIBRATE
     ============================================================ */
  function vibrate() {
    if (navigator.vibrate) {
      try { navigator.vibrate([300, 100, 300, 100, 500, 200, 100, 300]); }
      catch (e) {}
    }
  }
  APP.vibrate = vibrate;

  /* ============================================================
     BEEP (WebAudio)
     ============================================================ */

  /* Beep sukses: nada naik 4x */
  function playBeepSuccess() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const t0 = ctx.currentTime;
      [{ f: 660, t: 0 }, { f: 880, t: 0.06 }, { f: 1100, t: 0.12 }, { f: 1320, t: 0.18 }].forEach(function (n) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = n.f;
        g.gain.setValueAtTime(0.0001, t0 + n.t);
        g.gain.exponentialRampToValueAtTime(0.55, t0 + n.t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.t + 0.11);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0 + n.t); o.stop(t0 + n.t + 0.12);
      });
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 700);
    } catch (e) { console.warn('Beep sukses gagal:', e); }
  }
  APP.playBeepSuccess = playBeepSuccess;

  /* Beep gagal: nada turun 2x */
  function beepFailOnce() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(400, t0);
      o.frequency.setValueAtTime(200, t0 + 0.09);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.8, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + 0.19);
      o.onended = function () { try { ctx.close(); } catch (e) {} };
    } catch (e) { console.warn('Beep gagal gagal:', e); }
  }

  function playBeepFail() {
    beepFailOnce();
    setTimeout(beepFailOnce, 230);
  }
  APP.playBeepFail = playBeepFail;

  /* ============================================================
     FORMAT ARRAY SUHU UNTUK TAMPILAN
     ============================================================
     Input: suhuArr = [180, "", 200], suhuLabels = ["A","B","C"]
     Output: [{ label: "A", value: "180" }, { label: "C", value: "200" }]
     — hanya yang terisi, urut labels
     ============================================================ */
  function getSuhuTerisi(suhuArr, suhuLabels) {
    const out = [];
    if (!Array.isArray(suhuArr) || !Array.isArray(suhuLabels)) return out;
    for (let i = 0; i < suhuLabels.length; i++) {
      const val = suhuArr[i];
      if (val == null || String(val).trim() === '') continue;
      out.push({ label: suhuLabels[i], value: String(val).trim() });
    }
    return out;
  }
  APP.getSuhuTerisi = getSuhuTerisi;

})();
