/* ============================================================
   REKAP — DETAIL CELL (Overlay Info)
   ============================================================
   Dibuka saat double click / long press pada cell speed.
   Menampilkan:
   - No SPK
   - Spesifikasi (Jenis Tebal x Lebar x PanjangPot    BD BD)
   - Speed
   - Suhu (baris tambahan, hanya yang terisi)
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* ============================================================
     BUKA INFO DETAIL
     ============================================================
     @param {Object} context
       { mesin, tanggal, shift, items: [ { id, noSPK, speed, suhu } ] }
     ============================================================ */
  function bukaInfoDetail(context) {
    const items = context.items;
    if (!items || items.length === 0) return;

    const container = $('infoContainer');
    if (!container) return;
    container.innerHTML = '';

    const titleEl = document.querySelector('#overlayInfo .modal-title');
    if (titleEl) {
      titleEl.textContent = 'Detail · ' + context.mesin + ' · ' + context.tanggal + ' · ' + context.shift;
    }

    const masterSPK = APP.getMasterSPK();
    const mesinDetailMap = APP.getMesinDetailMap();

    items.forEach(function (item) {
      const spkData = masterSPK[item.noSPK] || {};
      const detail = {
        noSPK: item.noSPK,
        speed: item.speed,
        jenisPlastik: spkData.jenisPlastik || '',
        tebal: spkData.tebal || '',
        lebar: spkData.lebar || '',
        lipat: spkData.lipat || '',
        panjangPot: spkData.panjangPot || '',
        bd: spkData.bd || ''
      };

      /* Ambil suhuLabels mesin ini */
      const mesinDetail = mesinDetailMap[context.mesin];
      const suhuLabels = (mesinDetail && Array.isArray(mesinDetail.suhuLabels))
        ? mesinDetail.suhuLabels
        : [];

      const suhuItems = APP.getSuhuTerisi(item.suhu, suhuLabels);

      container.appendChild(buildInfoCard(detail, suhuItems));
    });

    if (container.children.length === 0) {
      container.innerHTML = '<div class="list-empty">Data detail tidak ditemukan.</div>';
    }

    const overlayInfo = $('overlayInfo');
    if (overlayInfo) overlayInfo.classList.add('active');
  }
  APP.bukaInfoDetail = bukaInfoDetail;

  /* ============================================================
     BUILD INFO CARD
     ============================================================
     @param {Object} d — { noSPK, speed, jenisPlastik, tebal, lebar, lipat, panjangPot, bd }
     @param {Array} suhuItems — [{ label, value }, ...] (hanya yang terisi)
     ============================================================ */
  function buildInfoCard(d, suhuItems) {
    const card = document.createElement('div');
    card.className = 'info-card';

    /* No SPK */
    const r1 = document.createElement('div');
    r1.className = 'info-row';
    r1.innerHTML = '<span class="info-label">No SPK</span>' +
      '<span class="info-value highlight">' + escapeHtml(d.noSPK || '—') + '</span>';
    card.appendChild(r1);

    /* Spesifikasi */
    const spec = APP.formatSPKInfo({
      jenisPlastik: d.jenisPlastik,
      tebal: d.tebal,
      lebar: d.lebar,
      lipat: d.lipat,
      panjangPot: d.panjangPot,
      bd: d.bd
    });

    const r2 = document.createElement('div');
    r2.className = 'info-row';
    r2.innerHTML = '<span class="info-label">Spesifikasi</span>' +
      '<span class="info-value">' + escapeHtml(spec) + '</span>';
    card.appendChild(r2);

    /* Speed */
    const r3 = document.createElement('div');
    r3.className = 'info-row';
    r3.innerHTML = '<span class="info-label">Speed</span>' +
      '<span class="info-value highlight">' + escapeHtml(d.speed || '—') + ' ' +
      escapeHtml(APP.SATUAN_SPEED) + '</span>';
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

  /* ============================================================
     CLOSE INFO OVERLAY
     ============================================================ */
  function closeInfoOverlay() {
    const overlayInfo = $('overlayInfo');
    if (overlayInfo) overlayInfo.classList.remove('active');
  }
  APP.closeInfoOverlay = closeInfoOverlay;

  /* ============================================================
     BIND (DOMContentLoaded)
     ============================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    const btnCloseInfo = $('btnCloseInfo');
    if (btnCloseInfo) btnCloseInfo.addEventListener('click', closeInfoOverlay);

    const btnTutupInfo = $('btnTutupInfo');
    if (btnTutupInfo) btnTutupInfo.addEventListener('click', closeInfoOverlay);
  });

})();
