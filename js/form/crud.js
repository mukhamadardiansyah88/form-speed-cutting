/* ============================================================
   FORM — CRUD (OK / Hapus / Simpan Batch)
   ============================================================
   - onOk: validasi → simpan ke pending / update server / update pending
   - onHapusConfirmed: hapus server / hapus pending
   - onSimpan: kirim semua pending ke server (tambahBanyak)

   Catatan: saat kirim ke server, sertakan field SPK lengkap
   (jenis, cetak, tebal, lebar, lipat, panjangPot, bd) yang
   diambil dari masterSPK[noSPK]. Kalau tidak ada → string kosong.
   ============================================================ */

(function () {

  const APP = window.APP = window.APP || {};
  const $ = APP.$;
  const showToast = APP.showToast;
  const callGAS = APP.callGAS;

  /* ============================================================
     AMBIL DATA SPK LENGKAP DARI MASTER
     ============================================================
     Return object dengan field siap kirim ke server:
     { jenis, cetak, tebal, lebar, lipat, panjangPot, bd }
     Kalau SPK tidak ditemukan → semua string kosong.
     ============================================================ */
  function getSPKPayload(noSPK) {
    const masterSPK = APP.getMasterSPK() || {};
    const d = masterSPK[noSPK] || {};
    return {
      jenis: String(d.jenisPlastik || '').trim(),
      cetak: String(d.cetakan || '').trim(),
      tebal: String(d.tebal || '').trim(),
      lebar: String(d.lebar || '').trim(),
      lipat: String(d.lipat || '').trim(),
      panjangPot: String(d.panjangPot || '').trim(),
      bd: String(d.bd || '').trim()
    };
  }
  APP.getSPKPayload = getSPKPayload;

  /* ============================================================
     ON OK (tombol OK di overlay input)
     ============================================================ */
  function onOk() {
    const mesin = APP.getCurrentMesin();
    if (!mesin) return;

    const spkData = APP.getCurrentSPKData();
    if (!APP.isCurrentSPKValid() || !spkData) return;

    /* Speed */
    const speed = APP.getSpeedValue();
    if (speed === '') {
      showToast('Speed belum diisi.', 'error');
      return;
    }

    /* Suhu */
    if (APP.isSuhuValid && !APP.isSuhuValid()) {
      showToast('Suhu tidak valid. Cek kembali.', 'error');
      return;
    }
    const suhuArr = APP.getSuhuValues ? APP.getSuhuValues() : [];

    const noSPK = spkData.noSPK;
    const formMode = APP.getFormMode();
    const editId = APP.getEditId();
    const pendingEditIndex = APP.getPendingEditIndex();

    const pendingInput = APP.getPendingInput();
    const hasilInput = APP.getHasilInput();

    /* Ambil payload SPK lengkap dari master */
    const spkPayload = getSPKPayload(noSPK);

    /* ---------- EDIT PENDING ---------- */
    if (formMode === 'edit' && pendingEditIndex !== null) {
      const rows = pendingInput[mesin] || [];
      if (rows[pendingEditIndex]) {
        rows[pendingEditIndex].noSPK = noSPK;
        rows[pendingEditIndex].speed = speed;
        rows[pendingEditIndex].suhu = suhuArr.slice();
        rows[pendingEditIndex].spk = spkPayload;
        pendingInput[mesin] = rows;
        APP.setPendingInput(pendingInput);
      }
      APP.closeInputOverlay();
      APP.refreshMesinButtons();
      APP.updateSummary();
      const listMesin = APP.getListMesin();
      if (listMesin) APP.renderList(listMesin);
      showToast('Baris diperbarui (belum tersimpan).', 'success');
      return;
    }

    /* ---------- EDIT SERVER ---------- */
    if (formMode === 'edit' && editId) {
      const btnOk = $('btnOk');
      if (btnOk) btnOk.disabled = true;

      /* Payload suhu & SPK: kirim sebagai JSON string (aman untuk JSONP) */
      const suhuJson = JSON.stringify(suhuArr);
      const spkJson = JSON.stringify(spkPayload);

      callGAS({
        action: 'editData',
        id: editId,
        noSPK: noSPK,
        speed: speed,
        suhu: suhuJson,
        spk: spkJson
      })
        .then(function (res) {
          if (btnOk) btnOk.disabled = false;
          if (!res || !res.success) {
            showToast('Gagal edit: ' + ((res && res.error) || 'unknown'), 'error');
            return;
          }
          APP.closeInputOverlay();
          showToast('Baris diperbarui.', 'success');
          APP.syncData();
        })
        .catch(function (err) {
          if (btnOk) btnOk.disabled = false;
          showToast('Gagal edit: ' + (err && err.message ? err.message : err), 'error');
        });
      return;
    }

    /* ---------- TAMBAH (pending) ---------- */
    if (!pendingInput[mesin]) pendingInput[mesin] = [];
    pendingInput[mesin].push({
      noSPK: noSPK,
      speed: speed,
      suhu: suhuArr.slice(),
      spk: spkPayload
    });
    APP.setPendingInput(pendingInput);

    APP.closeInputOverlay();
    APP.refreshMesinButtons();
    APP.updateSummary();
    const listMesin = APP.getListMesin();
    if (listMesin) APP.renderList(listMesin);
    showToast('Baris ditambahkan. Tekan Simpan untuk mengirim.', 'success');
  }
  APP.onOk = onOk;

  /* ============================================================
     ON HAPUS CONFIRMED
     ============================================================ */
  function onHapusConfirmed() {
    const state = APP.getConfirmState();
    const id = state.id;
    const mesin = state.mesin;
    const pIdx = state.pendingIndex;

    /* ---------- HAPUS SERVER ---------- */
    if (id) {
      const btnYes = $('btnYesConfirm');
      if (btnYes) btnYes.disabled = true;

      callGAS({ action: 'hapusData', id: id })
        .then(function (res) {
          if (btnYes) btnYes.disabled = false;
          if (!res || !res.success) {
            showToast('Gagal hapus: ' + ((res && res.error) || 'unknown'), 'error');
            return;
          }
          APP.closeConfirmOverlay();
          showToast('Data dihapus.', 'success');
          APP.syncData();
        })
        .catch(function (err) {
          if (btnYes) btnYes.disabled = false;
          showToast('Gagal hapus: ' + (err && err.message ? err.message : err), 'error');
        });
      return;
    }

    /* ---------- HAPUS PENDING ---------- */
    if (mesin && typeof pIdx === 'number') {
      const pendingInput = APP.getPendingInput();
      const rows = pendingInput[mesin] || [];
      rows.splice(pIdx, 1);
      if (rows.length === 0) delete pendingInput[mesin];
      else pendingInput[mesin] = rows;
      APP.setPendingInput(pendingInput);
    }

    APP.closeConfirmOverlay();
    APP.refreshMesinButtons();
    APP.updateSummary();
    const listMesin = APP.getListMesin();
    if (listMesin) APP.renderList(listMesin);
    showToast('Baris dihapus.', 'success');
  }
  APP.onHapusConfirmed = onHapusConfirmed;

  /* ============================================================
     ON SIMPAN (batch ke server)
     ============================================================ */
  function onSimpan() {
    if (APP.getIsSaving()) return;

    const ctx = APP.getTanggalShift();
    if (!ctx.tanggal) {
      showToast('Tanggal belum diisi.', 'error');
      return;
    }

    const pendingInput = APP.getPendingInput();
    const rows = [];
    Object.keys(pendingInput).forEach(function (mesin) {
      const list = pendingInput[mesin] || [];
      list.forEach(function (r) {
        /* r.spk = payload SPK lengkap dari master (jenis, cetak, tebal, ...) */
        const spk = r.spk || {};
        rows.push({
          tanggal: ctx.tanggal,
          shift: ctx.shift,
          mesin: mesin,
          noSPK: r.noSPK,
          speed: r.speed,
          suhu: r.suhu || [],
          jenis: spk.jenis || '',
          cetak: spk.cetak || '',
          tebal: spk.tebal || '',
          lebar: spk.lebar || '',
          lipat: spk.lipat || '',
          panjangPot: spk.panjangPot || '',
          bd: spk.bd || ''
        });
      });
    });

    if (rows.length === 0) {
      showToast('Belum ada baris baru untuk disimpan.', 'error');
      return;
    }

    const btn = $('btnSimpan');
    APP.setIsSaving(true);
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Menyimpan...';
    }

    callGAS({ action: 'tambahBanyak', rows: JSON.stringify(rows) })
      .then(function (res) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Simpan ke Sheet Inputan';
        }
        APP.setIsSaving(false);

        if (!res || !res.success) {
          showToast('Gagal simpan: ' + ((res && res.error) || 'unknown'), 'error');
          return;
        }

        const jumlah = res.jumlah != null ? res.jumlah : rows.length;
        APP.setPendingInput({});
        APP.updateSummary();

        if (res.duplikat > 0) {
          showToast('Disimpan: ' + jumlah + ' baris. ' + res.duplikat + ' baris dilewati (duplikat).', 'success');
        } else {
          showToast('Berhasil disimpan: ' + jumlah + ' baris.', 'success');
        }

        APP.syncData();
      })
      .catch(function (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '💾 Simpan ke Sheet Inputan';
        }
        APP.setIsSaving(false);
        showToast('Gagal simpan: ' + (err && err.message ? err.message : err), 'error');
      });
  }
  APP.onSimpan = onSimpan;

})();
