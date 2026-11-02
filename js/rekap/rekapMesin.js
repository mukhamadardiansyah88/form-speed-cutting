/* ============================================================
   REKAP — REKAP PER MESIN (Overlay Info)
   ============================================================
   Dibuka saat double click / long press pada nama mesin.
   Menampilkan semua baris mesin tersebut untuk rentang tanggal
   & shift yang sedang aktif, lengkap dengan:
   - Tanggal & Shift
   - Spesifikasi (formatSPKInfo)
   - Speed
   - Suhu (baris tambahan, hanya yang terisi)
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     BUKA REKAP MESIN
     ============================================================
     @param {Object} context
       { mesin, tanggalList, shiftChecked }
     ============================================================ */
  function bukaRekapMesin(context) {
    const mesin = context.mesin;
    const tanggalList = context.tanggalList;
    const shiftChecked = context.shiftChecked;

    const container = $('infoContainer');
    if (!container) return;
    container.innerHTML = '';

    const titleEl = document.querySelector('#overlayInfo .modal-title');
    if (titleEl) titleEl.textContent = 'Rekap Mesin · ' + mesin;

    const masterSPK = APP.getMasterSPK();
    const mesinDetailMap = APP.getMesinDetailMap();
    const mesinDetail = mesinDetailMap[mesin];
    const suhuLabels = (mesinDetail && Array.isArray(mesinDetail.suhuLabels))
      ? mesinDetail.suhuLabels
      : [];

    /* Index data: mapData[tanggal][shift] = [ { id, noSPK, speed, suhu } ] */
    const mapData = {};
    APP.getRekapRawData().forEach(function (r) {
      if (r.mesin !== mesin) return;
      if (shiftChecked.indexOf(r.shift) === -1) return;
      if (!mapData[r.tanggal]) mapData[r.tanggal] = {};
      if (!mapData[r.tanggal][r.shift]) mapData[r.tanggal][r.shift] = [];
      mapData[r.tanggal][r.shift].push({
        id: r.id,
        noSPK: r.noSPK,
        speed: r.speed,
        suhu: r.suhu || []
      });
    });

    let adaBaris = false;

    tanggalList.forEach(function (tgl) {
      shiftChecked.forEach(function (sh) {
        const rows = (mapData[tgl] && mapData[tgl][sh]) || [];

        if (rows.length === 0) {
          /* Slot kosong: tampilkan card "—" */
          adaBaris = true;
          container.appendChild(
            buildRekapCard(
              APP.ymdToDDMMYY(tgl),
              APP.SHIFT_LABEL[sh] || sh,
              null,
              null,
              []
            )
          );
        } else {
          rows.forEach(function (row) {
            adaBaris = true;

            const spkData = masterSPK[row.noSPK] || {};
            const spec = APP.formatSPKInfo({
              jenisPlastik: spkData.jenisPlastik || '',
              tebal: spkData.tebal || '',
              lebar: spkData.lebar || '',
              lipat: spkData.lipat || '',
              panjangPot: spkData.panjangPot || '',
              bd: spkData.bd || ''
            });

            const suhuItems = APP.getSuhuTerisi(row.suhu, suhuLabels);

            container.appendChild(
              buildRekapCard(
                APP.ymdToDDMMYY(tgl),
                APP.SHIFT_LABEL[sh] || sh,
                spec,
                row.speed,
                suhuItems
              )
            );
          });
        }
      });
    });

    if (!adaBaris) {
      container.innerHTML = '<div class="list-empty">Tidak ada data untuk mesin ini pada rentang/filter yang dipilih.</div>';
    }

    const overlayInfo = $('overlayInfo');
    if (overlayInfo) overlayInfo.classList.add('active');
  }
  APP.bukaRekapMesin = bukaRekapMesin;

  /* ============================================================
     BUILD REKAP CARD
     ============================================================
     @param {string} tanggal — "dd-mm-yy"
     @param {string} shift   — "PAGI" | "SORE" | "MALAM"
     @param {string|null} ukuran — hasil formatSPKInfo, null kalau kosong
     @param {string|null} speed  — speed string, null kalau kosong
     @param {Array} suhuItems    — [{ label, value }, ...] (hanya yang terisi)
     ============================================================ */
  function buildRekapCard(tanggal, shift, ukuran, speed, suhuItems) {
    const card = document.createElement('div');
    card.className = 'info-card';

    /* Tanggal & shift */
    const r1 = document.createElement('div');
    r1.className = 'info-row';
    r1.innerHTML = '<span class="info-label">' + escapeHtml(tanggal) + '</span>' +
      '<span class="info-value" style="color:var(--neon-pink)">' + escapeHtml(shift) + '</span>';
    card.appendChild(r1);

    /* Ukuran / spesifikasi */
    const r2 = document.createElement('div');
    r2.className = 'info-row';
    r2.innerHTML = '<span class="info-label">Spesifikasi</span>' +
      '<span class="info-value">' + escapeHtml(ukuran || '—') + '</span>';
    card.appendChild(r2);

    /* Speed */
    const r3 = document.createElement('div');
    r3.className = 'info-row';
    const speedText = speed ? (speed + ' ' + APP.SATUAN_SPEED) : '—';
    r3.innerHTML = '<span class="info-label">Speed</span>' +
      '<span class="info-value highlight">' + escapeHtml(speedText) + '</span>';
    card.appendChild(r3);

    /* Suhu (kalau ada) */
    if (suhuItems && suhuItems.length > 0) {
      const suhuWrap = document.createElement('div');
      suhuWrap.className = 'info-suhu-wrap';

      suhuItems.forEach(function (item) {
        const el = document.createElement('div');
        el.className = 'info-suhu-item';

        const lbl = document.createElement('span');
        lbl.className = 'info-suhu-label';
        lbl.textContent = item.label;

        const val = document.createElement('span');
        val.className = 'info-suhu-value';
        val.textContent = item.value + ' ' + APP.SATUAN_SUHU;

        el.appendChild(lbl);
        el.appendChild(val);
        suhuWrap.appendChild(el);
      });

      card.appendChild(suhuWrap);
    }

    return card;
  }

  /* ============================================================
     ESCAPE HTML (anti XSS)
     ============================================================ */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
