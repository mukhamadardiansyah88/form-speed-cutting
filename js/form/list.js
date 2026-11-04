/* ============================================================
   FORM — OVERLAY LIST (Daftar Data per Mesin)
   ============================================================
   Menampilkan:
   - Baris tersimpan (server) di atas
   - Baris pending (belum disimpan) di bawah
   Tiap card: No SPK, Speed, Jejer, Suhu (hanya yang terisi)
   Tombol: Edit, Hapus
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;

  /* State lokal modul ini */
  let listMesin = null;

  /* ============================================================
     GETTER / SETTER
     ============================================================ */
  function getListMesin() { return listMesin; }
  APP.getListMesin = getListMesin;

  function setListMesin(v) { listMesin = v; }
  APP.setListMesin = setListMesin;

  /* ============================================================
     OPEN LIST OVERLAY
     ============================================================ */
  function openListOverlay(namaMesin) {
    setListMesin(namaMesin);

    const title = $('listTitle');
    if (title) title.textContent = namaMesin + ' · Daftar Data';

    renderList(namaMesin);
    const overlay = $('overlayList');
    if (overlay) overlay.classList.add('active');
  }
  APP.openListOverlay = openListOverlay;

  /* ============================================================
     CLOSE LIST OVERLAY
     ============================================================ */
  function closeListOverlay() {
    const overlay = $('overlayList');
    if (overlay) overlay.classList.remove('active');
    setListMesin(null);
  }
  APP.closeListOverlay = closeListOverlay;

  /* ============================================================
     RENDER LIST
     ============================================================ */
  function renderList(namaMesin) {
    const container = $('listContainer');
    if (!container) return;
    container.innerHTML = '';

    const hasilInput = APP.getHasilInput();
    const pendingInput = APP.getPendingInput();
    const serverRows = (hasilInput[namaMesin] || []).slice();
    const pendingRows = (pendingInput[namaMesin] || []).slice();

    if (serverRows.length === 0 && pendingRows.length === 0) {
      container.innerHTML = '<div class="list-empty">Belum ada data untuk mesin ini.</div>';
      return;
    }

    /* Server dulu */
    serverRows.forEach(function (row) {
      container.appendChild(buildCard(namaMesin, row, false, null));
    });

    /* Pending di bawah */
    pendingRows.forEach(function (row, idx) {
      container.appendChild(buildCard(namaMesin, row, true, idx));
    });
  }
  APP.renderList = renderList;

  /* ============================================================
     BUILD CARD
     ============================================================
     row: { id?, noSPK, speed, jejer, suhu: [...] }
     ============================================================ */
  function buildCard(namaMesin, row, isPending, pendingIndex) {
    const card = document.createElement('div');
    card.className = 'data-card';

    /* --- Info utama: No SPK + Speed + Jejer --- */
    const info = document.createElement('div');
    info.className = 'card-info';

    /* No SPK */
    const f1 = document.createElement('div');
    f1.className = 'card-field';
    const l1 = document.createElement('div');
    l1.className = 'card-label';
    l1.textContent = 'No SPK';
    const v1 = document.createElement('div');
    v1.className = 'card-value';
    v1.textContent = row.noSPK || '—';
    f1.appendChild(l1); f1.appendChild(v1);

    /* Speed */
    const f2 = document.createElement('div');
    f2.className = 'card-field';
    const l2 = document.createElement('div');
    l2.className = 'card-label';
    l2.textContent = 'Speed';
    const v2 = document.createElement('div');
    v2.className = 'card-value';
    v2.textContent = row.speed || '—';
    f2.appendChild(l2); f2.appendChild(v2);

    /* Jejer */
    const f3 = document.createElement('div');
    f3.className = 'card-field';
    const l3 = document.createElement('div');
    l3.className = 'card-label';
    l3.textContent = 'Jejer';
    const v3 = document.createElement('div');
    v3.className = 'card-value';
    v3.textContent = (row.jejer != null && String(row.jejer).trim() !== '') ? String(row.jejer) : '—';
    f3.appendChild(l3); f3.appendChild(v3);

    info.appendChild(f1); info.appendChild(f2); info.appendChild(f3);
    card.appendChild(info);

    /* --- Suhu (hanya yang terisi) --- */
    const suhuHtml = buildSuhuRow(row, namaMesin);
    if (suhuHtml) card.appendChild(suhuHtml);

    /* --- Badge pending --- */
    if (isPending) {
      const badge = document.createElement('div');
      badge.className = 'card-pending';
      badge.textContent = 'Belum tersimpan';
      card.appendChild(badge);
    }

    /* --- Actions --- */
    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'btn-edit';
    btnEdit.textContent = '✏️ Edit';
    btnEdit.addEventListener('click', function () {
      if (isPending) {
        APP.openInputOverlay(namaMesin, 'edit', null, pendingIndex, true);
      } else {
        APP.openInputOverlay(namaMesin, 'edit', row.id, null, true);
      }
    });

    const btnDelete = document.createElement('button');
    btnDelete.type = 'button';
    btnDelete.className = 'btn-delete';
    btnDelete.textContent = '🗑️ Hapus';
    btnDelete.addEventListener('click', function () {
      if (isPending) {
        APP.openConfirmOverlay(null, namaMesin, pendingIndex);
      } else {
        APP.openConfirmOverlay(row.id, namaMesin, null);
      }
    });

    actions.appendChild(btnEdit);
    actions.appendChild(btnDelete);
    card.appendChild(actions);

    return card;
  }

  /* ============================================================
     BUILD SUHU ROW (hanya yang terisi)
     ============================================================ */
  function buildSuhuRow(row, namaMesin) {
    const detail = APP.getMesinDetailMap()[namaMesin];
    if (!detail || !detail.suhuLabels || detail.suhuLabels.length === 0) return null;

    const suhuTerisi = APP.getSuhuTerisi(row.suhu, detail.suhuLabels);
    if (suhuTerisi.length === 0) return null;

    const wrap = document.createElement('div');
    wrap.className = 'card-suhu-row';

    suhuTerisi.forEach(function (item) {
      const el = document.createElement('div');
      el.className = 'card-suhu-item';

      const lbl = document.createElement('span');
      lbl.className = 'card-suhu-label';
      lbl.textContent = item.label;

      const val = document.createElement('span');
      val.className = 'card-suhu-value';
      val.textContent = item.value + ' ' + APP.SATUAN_SUHU;

      el.appendChild(lbl);
      el.appendChild(val);
      wrap.appendChild(el);
    });

    return wrap;
  }

})();
