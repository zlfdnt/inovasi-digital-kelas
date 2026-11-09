'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => /^https?:\/\//i.test(u) ? esc(u) : '#';
const CFG = window.APP_CONFIG || {}, OK = /^https:\/\/script\.google\.com\//.test(CFG.GAS_URL || '') && !/GANTI|XXXX/.test(CFG.GAS_URL);
const JP = { 1: '08.00 – 09.30', 2: '10.00 – 11.30', 3: '13.00 – 14.30' };
let token = localStorage.getItem('bk_t') || '', me = null, S = { sesi: {}, sumber: [] }, view = 'beranda';
try { me = JSON.parse(localStorage.getItem('bk_m') || 'null'); } catch (e) {}
if (!token) me = null;

function toast(m, t = 'ok') { const e = $('#toast'); e.textContent = m; e.className = 'show ' + t; clearTimeout(toast.t); toast.t = setTimeout(() => e.className = '', 3500); }
async function api(action, data) {
  if (!OK) { toast('Konfigurasi belum lengkap: isi GAS_URL di js/config.js', 'err'); return { success: false, message: 'Konfigurasi belum lengkap.' }; }
  try {
    const r = await fetch(CFG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token, data }) });
    const j = await r.json(); if (j.code === 'AUTH') logout(true); return j;
  } catch (e) { return { success: false, message: 'Gagal terhubung ke server: ' + e.message }; }
}
let bootP = null, PRE = {};   // dedupe baca yang sedang berjalan + prefetch rekap
function loadBoot() {
  if (bootP) return bootP;
  bootP = api('boot').then(r => { bootP = null; if (r.success) { S = r.data; try { localStorage.setItem('bk_boot', JSON.stringify(r.data)); } catch (e) {} } return r.success; });
  return bootP;
}

// ---------- Cangkang & navigasi ----------
const NAV_P = [['beranda', 'Beranda', '🏠'], ['absen', 'Absensi', '✅'], ['refleksi', 'Refleksi', '💭'], ['praktik', 'Praktik', '📝'], ['sumber', 'Sumber', '📚']];
const NAV_A = [['dash', 'Dashboard', '📊'], ['rekap', 'Rekap', '🗂️'], ['kelola', 'Kelola', '⚙️']];
const TITLE = { beranda: 'Beranda', absen: 'Absensi', refleksi: 'Refleksi', praktik: 'Lembar Praktik', sumber: 'Sumber Belajar', dash: 'Dashboard Admin', rekap: 'Rekap Data', kelola: 'Kelola Sumber Belajar' };
function shell() {
  $('#app').innerHTML = `<aside class="side"><div class="brand"><div class="logo">🎓</div><div><b>BOSKIN 2026</b><small>Guru Kreatif · Siswa Aktif</small></div></div><nav>${(me ? NAV_A.concat(NAV_P) : NAV_P).map(n => `<button data-v="${n[0]}"><span>${n[2]}</span>${n[1]}</button>`).join('')}</nav></aside><main id="main"></main>`;
  $$('[data-v]').forEach(b => b.onclick = () => go(b.dataset.v));
}
async function go(v) {
  if (!V[v]) v = 'beranda'; view = v; history.replaceState(null, '', '#' + v);
  $$('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('#main').innerHTML = `<div class="top"><div><h1>${TITLE[v]}</h1><small>Merajut digitalisasi pembelajaran tanpa batas</small></div>${me ? `<div><span class="tag">👤 ${esc(me.nama || me.email)}</span> <button class="btn ghost sm" id="out">Keluar</button></div>` : '<button class="btn glow sm" id="inAdm">Masuk Admin</button>'}</div><div id="body"><div class="skel"></div></div>`;
  $('#out')?.addEventListener('click', () => logout()); $('#inAdm')?.addEventListener('click', loginModal);
  await V[v]($('#body')); slider(); window.scrollTo(0, 0);
}
function logout(silent) { token = ''; me = null; localStorage.removeItem('bk_t'); localStorage.removeItem('bk_m'); if (!silent) toast('Anda telah keluar.'); shell(); go('beranda'); }
function needLogin(b) { b.innerHTML = '<div class="card"><h2>Khusus admin</h2><p>Silakan masuk sebagai admin untuk membuka halaman ini.</p><button class="btn glow" id="nl">Masuk Admin</button></div>'; $('#nl', b).onclick = loginModal; }

// ---------- Slideshow ----------
function slider() {
  $$('.slides').forEach(s => {
    if (s.dataset.on) return; s.dataset.on = 1;
    const it = $$('.slide', s), dots = $$('.dot', s.parentElement); let i = 0;
    const show = n => { i = (n + it.length) % it.length; it.forEach((e, k) => e.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
    show(0); if (it.length < 2) return; dots.forEach((d, k) => d.onclick = () => show(k));
    const t = setInterval(() => { if (!document.body.contains(s)) return clearInterval(t); if (document.visibilityState === 'visible') show(i + 1); }, +s.dataset.ms || 5000);
  });
}
const dots = n => `<div class="dots">${'<i class="dot"></i>'.repeat(n)}</div>`;

// ---------- Form ----------
const fld = (n, l, t = 'text', ex = '') => `<label>${l}<input name="${n}" type="${t}" required ${ex}></label>`;
const area = (n, l, ph = '') => `<label>${l}<textarea name="${n}" rows="4" required maxlength="1500" placeholder="${ph}"></textarea></label>`;
const check = t => `<label class="chk"><input type="checkbox" name="setuju" required><span>${t}</span></label>`;
const F = {
  nama: fld('nama', 'Nama Lengkap', 'text', 'autocomplete="name" maxlength="100"'), sekolah: fld('sekolah', 'Asal Sekolah', 'text', 'maxlength="150"'),
  mapel: fld('mapel', 'Mata Pelajaran', 'text', 'maxlength="80"'),
  jenjang: `<label>Jenjang<select name="jenjang" required><option value="">Pilih…</option>${['SD', 'SMP', 'SMA', 'SMK', 'Lainnya'].map(x => `<option>${x}</option>`).join('')}</select></label>`
};
function bindForm(f, action, msg, done, pre) {   // draf tersimpan di perangkat; tombol "Kirim ulang" bila gagal
  const k = 'dr_' + action;
  try { Object.entries(JSON.parse(localStorage.getItem(k) || '{}')).forEach(([n, v]) => { const e = f.elements[n]; if (e && e.type !== 'checkbox' && e.type !== 'hidden' && e.type !== 'file') e.value = v; }); } catch (e) {}
  f.addEventListener('input', () => { const o = Object.fromEntries(new FormData(f)); delete o.setuju; delete o.sesi; delete o.file; localStorage.setItem(k, JSON.stringify(o)); });
  f.addEventListener('submit', async e => {
    e.preventDefault(); const b = f.querySelector('button.btn'), t = b.textContent; b.disabled = true; b.textContent = 'Mengirim…';
    let data = Object.fromEntries(new FormData(f)); try { if (pre) data = await pre(data); } catch (er) { b.disabled = false; b.textContent = t; return toast(er.message, 'err'); }
    const r = await api(action, data);
    b.disabled = false; b.textContent = r.success ? t : 'Kirim ulang';
    if (r.success) { toast(r.message || msg); localStorage.removeItem(k); f.reset(); done && done(r); } else toast(r.message || 'Gagal mengirim.', 'err');
  });
}

// ---------- Halaman peserta ----------
const HERO = [['Guru Kreatif, Siswa Aktif', 'Merajut digitalisasi pembelajaran tanpa batas bersama BOSKIN 2026.', '🎓', 'g1'], ['Absensi per sesi JP', 'Catat kehadiran cepat dari ponsel — tanpa login, tanpa rekap manual.', '✅', 'g2'], ['Bagikan karya, tularkan inspirasi', 'Kumpulkan lembar praktik dan temukan sumber belajar lewat QR Code.', '🚀', 'g3']];
const V = {
  async beranda(b) {
    b.innerHTML = `<div class="hero"><div class="slides" data-ms="5000">${HERO.map(h => `<div class="slide ${h[3]}"><h1>${h[0]}</h1><p>${h[1]}</p><span class="em">${h[2]}</span></div>`).join('')}</div>${dots(HERO.length)}</div>
    <div class="grid">${NAV_P.slice(1).map((n, i) => `<div class="card stat" style="cursor:pointer" data-go="${n[0]}"><span class="ic">${n[2]}</span><b>${n[1]}</b><p style="color:var(--mu);margin:6px 0 12px">${['Pilih sesi JP lalu kirim presensi.', 'Tuliskan refleksi dan tindak lanjut.', 'Kumpulkan tautan hasil praktik.', 'Tautan karya & QR Code.'][i]}</p><span class="btn glow sm">Buka →</span></div>`).join('')}</div>`;
    $$('[data-go]', b).forEach(c => c.onclick = () => go(c.dataset.go));
  },
  async absen(b) {
    await loadBoot();
    b.innerHTML = `<section class="card"><h2>Pilih Sesi Presensi</h2><div class="jp">${[1, 2, 3].map(n => `<button type="button" class="jpb ${S.sesi[n] ? 'open' : ''}" data-s="${n}" ${S.sesi[n] ? '' : 'disabled'}><b>JP ${n}</b><small>${JP[n]} WIB</small><i>${S.sesi[n] ? '● Dibuka' : 'Ditutup'}</i></button>`).join('')}</div></section>
    <form id="f" class="card"><h2>Formulir Presensi</h2><input type="hidden" name="sesi">${F.nama}${F.sekolah}${F.mapel}${F.jenjang}${check('Saya menyatakan hadir secara langsung dan mengikuti sesi dengan integritas.')}<button class="btn glow">Kirim Presensi</button></form>`;
    $$('.jpb.open', b).forEach(x => x.onclick = () => { $$('.jpb', b).forEach(y => y.classList.remove('sel')); x.classList.add('sel'); $('[name=sesi]', b).value = x.dataset.s; });
    bindForm($('#f', b), 'absen', 'Presensi tercatat.', () => $$('.jpb', b).forEach(y => y.classList.remove('sel')));
  },
  async refleksi(b) {
    b.innerHTML = `<form id="f" class="card"><div class="prog"><i id="pg"></i></div><h2>Refleksi & Tindak Lanjut</h2>${F.nama}${F.sekolah}${area('konsep', '1. Apa konsep/ide utama yang Anda peroleh?')}${area('praktik', '2. Bagaimana penerapan media digital pada materi ajar Anda?', 'Ceritakan pengalaman, tantangan, dan respons peserta didik…')}${area('tindak_lanjut', '3. Apa rencana tindak lanjut Anda?')}<button class="btn glow">Kirim Refleksi</button></form>`;
    const f = $('#f', b), up = () => { const n = $$('textarea', f).filter(t => t.value.trim()).length; $('#pg', f).style.width = n / 3 * 100 + '%'; };
    f.addEventListener('input', up); bindForm(f, 'refleksi', 'Refleksi terkirim.', up); up();
  },
  async praktik(b) {
    b.innerHTML = `<form id="f" class="card"><h2>Pengumpulan Lembar Praktik</h2>${F.nama}${F.sekolah}${fld('judul', 'Judul Media Pembelajaran', 'text', 'maxlength="150"')}<label>Platform<select name="platform" required><option value="">Pilih…</option>${['Canva', 'Quizizz', 'Wordwall', 'Google Sites', 'Video/Lainnya'].map(x => `<option>${x}</option>`).join('')}</select></label><label>Tautan Hasil Karya (akses “siapa saja dengan tautan”)<input name="tautan" type="url" placeholder="https://…"></label><label>…atau unggah berkas (PDF, JPG, PNG, PPTX · maks. 5 MB)<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.pptx"></label><label>Catatan (opsional)<textarea name="catatan" rows="3" maxlength="1000"></textarea></label>${check('Saya menyatakan karya ini orisinal dan dikembangkan selama kegiatan.')}<button class="btn glow">Kirim Lembar Praktik</button></form>`;
    bindForm($('#f', b), 'praktik', 'Lembar praktik terkirim.', null, async d => {
      const f = d.file; delete d.file;
      if (f && f.size) {
        if (f.size > 5 * 1024 * 1024) throw new Error('Ukuran berkas maksimal 5 MB.');
        if (!/\.(pdf|jpe?g|png|pptx)$/i.test(f.name)) throw new Error('Format berkas harus PDF, JPG, PNG, atau PPTX.');
        const data = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => no(new Error('Gagal membaca berkas.')); r.readAsDataURL(f); });
        d.berkas = { nama: f.name, data };
      }
      if (!d.tautan && !d.berkas) throw new Error('Isi tautan hasil karya atau unggah berkas.');
      return d;
    });
  },
  async sumber(b) {   // tampil instan dari cache perangkat, lalu segarkan di latar
    const draw = () => { const L = S.sumber || []; b.innerHTML = L.length ? `<div class="grid g2">${L.map(cardSumber).join('')}</div>` : '<div class="card">Belum ada sumber belajar.</div>'; $$('.qr', b).forEach(q => window.QRCode && new QRCode(q, { text: q.dataset.u, width: 88, height: 88, colorDark: '#431fb8' })); slider(); };
    let c = null; try { c = JSON.parse(localStorage.getItem('bk_boot') || 'null'); } catch (e) {}
    if (c && c.sumber) { S = c; draw(); }
    const h0 = JSON.stringify(c && c.sumber); await loadBoot();
    if (!c || JSON.stringify(S.sumber) !== h0) draw();
  },
  // ---------- Admin ----------
  async dash(b) {
    if (!me) return needLogin(b);
    const br = await api('batch', { calls: [{ action: 'admin.dashboard' }, { action: 'admin.rekap', data: { tab: 'praktik' } }] });
    const r = br.success ? br.data[0] : br; if (br.success && br.data[1] && br.data[1].success) PRE.praktik = br.data[1].data;
    if (!r.success) return b.innerHTML = `<div class="card">${esc(r.message)}</div>`;
    const d = r.data, P = Math.max(d.peserta, 1), pct = Math.round(d.hariIni / P * 1000) / 10, H = [d.hadir[1], d.hadir[2], d.hadir[3]], mx = Math.max(P, ...H);
    const X = [50, 180, 310], Y = v => 130 - v / mx * 100, pts = H.map((v, i) => X[i] + ',' + Y(v)).join(' ');
    const st = d.status, tot = Math.max(d.praktik, 1), C = { Baru: '#F5A23B', Ditinjau: '#3B82F6', Disetujui: '#2EC97A', Revisi: '#EF4444' };
    let a = 0; const cg = Object.keys(C).map(k => { const s = a; a += (st[k] || 0) / tot * 100; return `${C[k]} ${s}% ${a}%`; }).join(',');
    b.innerHTML = `<div class="grid" style="margin-bottom:20px">${[['Total Peserta', d.peserta, '👥'], ['Hadir Hari Ini', pct + '%', '✅'], ['Refleksi Masuk', d.refleksi, '💭'], ['Lembar Praktik', d.praktik, '📝']].map(s => `<div class="card stat"><span class="ic">${s[2]}</span><span>${s[0]}</span><b>${s[1]}</b></div>`).join('')}</div>
    <div class="grid g2"><div class="card"><h2>Tren Kehadiran per Sesi JP</h2><svg viewBox="0 0 360 160" width="100%" role="img" aria-label="Grafik kehadiran"><line x1="30" x2="350" y1="${Y(P * .95)}" y2="${Y(P * .95)}" stroke="#2EC97A" stroke-dasharray="5 4"/><text x="352" y="${Y(P * .95) - 4}" font-size="9" fill="#2EC97A" text-anchor="end">Target 95%</text><polyline points="${pts}" fill="none" stroke="#5B3FD0" stroke-width="3" stroke-linejoin="round"/>${H.map((v, i) => `<circle cx="${X[i]}" cy="${Y(v)}" r="5" fill="#fff" stroke="#5B3FD0" stroke-width="3"/><text x="${X[i]}" y="${Y(v) - 10}" font-size="11" text-anchor="middle" font-weight="700">${v}</text><text x="${X[i]}" y="152" font-size="11" text-anchor="middle" fill="#64748B">JP ${i + 1}</text>`).join('')}</svg></div>
    <div class="card"><h2>Status Sesi JP</h2>${[1, 2, 3].map(n => `<div class="sw"><div><b>JP ${n}</b> <small>${JP[n]}</small></div><button class="btn sm ${d.sesi[n] ? 'bad' : 'glow'}" data-t="${n}" data-on="${d.sesi[n] ? 0 : 1}">${d.sesi[n] ? 'Tutup Sesi' : 'Buka Sesi'}</button></div>`).join('')}</div></div>
    <div class="grid g2"><div class="card"><h2>Karya Terbaru</h2><div class="tw"><table><tr><th>Guru</th><th>Judul</th><th>Status</th></tr>${d.recent.map(q => `<tr><td>${esc(q.nama)}<br><small>${esc(q.sekolah)}</small></td><td>${esc(q.judul)}</td><td><span class="pill ${esc(q.status)}">${esc(q.status)}</span></td></tr>`).join('') || '<tr><td colspan="3">Belum ada.</td></tr>'}</table></div></div>
    <div class="card"><h2>Status Lembar Praktik</h2><div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap"><div class="donut" style="background:conic-gradient(${d.praktik ? cg : '#E2E8F0 0 100%'})"></div><div>${Object.keys(C).map(k => `<div class="lg"><i style="background:${C[k]}"></i>${k}: <b>${st[k] || 0}</b></div>`).join('')}</div></div></div></div>`;
    $$('[data-t]', b).forEach(x => x.onclick = async () => { const r = await api('admin.sesi', { sesi: +x.dataset.t, aktif: +x.dataset.on }); toast(r.message, r.success ? 'ok' : 'err'); go('dash'); });
  },
  async rekap(b) {
    if (!me) return needLogin(b);
    const T = [['praktik', 'Lembar Praktik'], ['kehadiran', 'Kehadiran'], ['refleksi', 'Refleksi'], ['peserta', 'Peserta']]; let tab = 'praktik', rows = [];
    b.innerHTML = `<div class="card"><div class="tabs">${T.map(t => `<button data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div class="tools"><input id="q" placeholder="Cari nama, sekolah, judul…" type="search"><button class="btn glow" id="ex">⬇ Unduh Excel (.csv)</button></div><div class="tw" id="tb"></div></div>`;
    const draw = () => {
      const q = $('#q', b).value.toLowerCase(), R = rows.filter(r => !q || Object.values(r).join(' ').toLowerCase().includes(q)), k = R[0] ? Object.keys(R[0]).filter(x => x !== 'id' && x !== 'id_peserta') : [];
      $('#tb', b).innerHTML = R.length ? `<table><tr>${k.map(x => `<th>${x.replace('_', ' ')}</th>`).join('')}${tab === 'praktik' ? '<th>Aksi</th>' : ''}</tr>${R.map(r => `<tr>${k.map(x => `<td>${x === 'tautan' ? `<a href="${safeUrl(r[x])}" target="_blank" rel="noopener">Buka</a>` : x === 'status' ? `<span class="pill ${esc(r[x])}">${esc(r[x])}</span>` : esc(r[x])}</td>`).join('')}${tab === 'praktik' ? `<td style="white-space:nowrap"><button class="btn sm" data-st="Disetujui" data-id="${esc(r.id)}">Setujui</button> <button class="btn ghost sm" data-st="Revisi" data-id="${esc(r.id)}">Revisi</button></td>` : ''}</tr>`).join('')}</table>` : 'Belum ada data.';
      $$('[data-st]', b).forEach(x => x.onclick = async () => { const r = await api('admin.praktik.status', { id: x.dataset.id, status: x.dataset.st }); toast(r.message, r.success ? 'ok' : 'err'); load(); });
    };
    const load = async () => { $$('[data-tab]', b).forEach(x => x.classList.toggle('on', x.dataset.tab === tab)); $('#tb', b).innerHTML = '<div class="skel"></div>'; let r; if (PRE[tab]) { r = { success: true, data: PRE[tab] }; delete PRE[tab]; } else r = await api('admin.rekap', { tab }); rows = r.success ? r.data : []; if (!r.success) toast(r.message, 'err'); draw(); };
    $$('[data-tab]', b).forEach(x => x.onclick = () => { tab = x.dataset.tab; load(); }); $('#q', b).oninput = draw;
    $('#ex', b).onclick = () => { if (!rows.length) return toast('Tidak ada data untuk diunduh.', 'err'); const k = Object.keys(rows[0]), q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"'; const blob = new Blob(['\ufeff' + [k.map(q).join(',')].concat(rows.map(r => k.map(c => q(r[c])).join(','))).join('\r\n')], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rekap-' + tab + '.csv'; a.click(); URL.revokeObjectURL(a.href); };
    load();
  },
  async kelola(b) {
    if (!me) return needLogin(b); await loadBoot();
    b.innerHTML = `<form id="f" class="card"><h2>Tambah Sumber Belajar</h2>${fld('judul', 'Judul')}${fld('tautan', 'Tautan', 'url', 'placeholder="https://…"')}<label>Jenis<input name="jenis" maxlength="40" placeholder="Showcase / Pedoman / Template"></label><label>Keterangan<textarea name="keterangan" rows="2" maxlength="400"></textarea></label><label>Gambar slideshow (opsional, tautan https dipisah tanda |)<input name="gambar" placeholder="https://…/1.jpg|https://…/2.jpg"></label><button class="btn glow">Simpan</button></form>
    <div class="card"><h2>Daftar Sumber</h2>${(S.sumber || []).map(s => `<div class="sw"><div><b>${esc(s.judul)}</b><br><small>${esc(s.tautan)}</small></div><button class="btn bad sm" data-del="${esc(s.id)}">Hapus</button></div>`).join('') || 'Kosong.'}</div>`;
    $('#f', b).onsubmit = async e => { e.preventDefault(); const r = await api('admin.sumber.simpan', Object.fromEntries(new FormData(e.target))); toast(r.message, r.success ? 'ok' : 'err'); if (r.success) go('kelola'); };
    $$('[data-del]', b).forEach(x => x.onclick = async () => { if (!confirm('Hapus sumber ini?')) return; const r = await api('admin.sumber.hapus', { id: x.dataset.del }); toast(r.message, r.success ? 'ok' : 'err'); go('kelola'); });
  }
};
function cardSumber(s, i) {
  const im = (s.gambar || '').split('|').filter(u => /^https:\/\//.test(u)), em = ['📘', '🎨', '🧩'], gr = ['g1', 'g2', 'g3'];
  const sl = im.length ? im.map(u => `<div class="slide" style="background-image:url('${encodeURI(u).replace(/[()'"]/g, '')}')"></div>`) : [0, 1, 2].map(k => `<div class="slide ${gr[(i + k) % 3]}"><span>${em[(i + k) % 3]}</span></div>`);
  return `<article class="card sc"><div class="ph"><div class="slides" data-ms="${4000 + i * 500}">${sl.join('')}</div>${dots(sl.length)}</div><div class="sb"><span class="tag">${esc(s.jenis || 'Sumber')}</span><h3>${esc(s.judul)}</h3><p>${esc(s.keterangan)}</p><div class="qr" data-u="${esc(s.tautan)}"></div><div class="row"><a class="btn glow" href="${safeUrl(s.tautan)}" target="_blank" rel="noopener">Buka Tautan</a><button class="btn ghost" data-copy="${esc(s.tautan)}">Salin</button></div></div></article>`;
}

// ---------- Login admin ----------
function loginModal() {
  const d = document.createElement('div'); d.className = 'modal';
  d.innerHTML = `<div class="card"><h2>Masuk Admin</h2><div id="g" style="margin-bottom:14px">Memuat…</div><details><summary>Akses darurat</summary><form id="df" style="margin-top:12px">${fld('username', 'Nama pengguna', 'text', 'autocomplete="username"')}${fld('password', 'Kata sandi', 'password', 'autocomplete="current-password"')}<button class="btn glow">Masuk</button></form></details><button class="btn ghost" id="x" style="margin-top:14px">Tutup</button></div>`;
  document.body.append(d); $('#x', d).onclick = () => d.remove();
  api('auth.config').then(r => {
    const id = r.success && r.data.googleClientId;
    if (id && window.google && google.accounts) { google.accounts.id.initialize({ client_id: id, callback: async c => fin(await api('auth.google', { credential: c.credential }), d) }); google.accounts.id.renderButton($('#g', d), { theme: 'outline', size: 'large' }); }
    else $('#g', d).textContent = 'Login Google belum dikonfigurasi — gunakan akses darurat.';
  });
  $('#df', d).onsubmit = async e => { e.preventDefault(); const x = await api('auth.darurat', Object.fromEntries(new FormData(e.target))); e.target.password.value = ''; fin(x, d); };
}
function fin(x, d) { if (!x.success) return toast(x.message, 'err'); token = x.data.token; me = x.data.me; localStorage.setItem('bk_t', token); localStorage.setItem('bk_m', JSON.stringify(me)); d.remove(); shell(); go('dash'); }

// ---------- Efek: glow kartu, salin, kursor partikel ----------
document.addEventListener('pointermove', e => { const c = e.target.closest && e.target.closest('.card'); if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); } });
document.addEventListener('click', e => { const c = e.target.closest('[data-copy]'); if (c) navigator.clipboard.writeText(c.dataset.copy).then(() => toast('Tautan disalin.'), () => toast('Gagal menyalin.', 'err')); });
(function () {
  if (matchMedia('(pointer:coarse)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const c = document.createElement('canvas'); c.id = 'fx'; document.body.appendChild(c); const x = c.getContext('2d'); let W, H, m = { x: -99, y: -99 }, P = [];
  const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight; }; rs(); addEventListener('resize', rs);
  addEventListener('mousemove', e => { m.x = e.clientX; m.y = e.clientY; for (let i = 0; i < 2; i++) P.push({ x: m.x, y: m.y, vx: (Math.random() - .5) * 1.8, vy: (Math.random() - .5) * 1.8 - .3, l: 1, s: Math.random() * 2.4 + .8, h: 250 + Math.random() * 50 }); if (P.length > 160) P.splice(0, P.length - 160); });
  document.addEventListener('mouseleave', () => { m.x = m.y = -99; });
  (function loop() {
    x.clearRect(0, 0, W, H); P = P.filter(p => p.l > 0);
    P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .01; p.l -= .022; x.globalAlpha = Math.max(p.l, 0); x.fillStyle = `hsl(${p.h},85%,62%)`; x.shadowColor = x.fillStyle; x.shadowBlur = 8; x.beginPath(); x.arc(p.x, p.y, p.s * p.l, 0, 7); x.fill(); });
    x.globalAlpha = 1; x.shadowBlur = 0; x.lineCap = 'round';
    [['#fff', 5], ['#431fb8', 2]].forEach(a => { x.strokeStyle = a[0]; x.lineWidth = a[1]; x.beginPath(); x.moveTo(m.x - 7, m.y); x.lineTo(m.x + 7, m.y); x.moveTo(m.x, m.y - 7); x.lineTo(m.x, m.y + 7); x.stroke(); });
    requestAnimationFrame(loop);
  })();
  document.documentElement.classList.add('nocursor');
})();

// ---------- Mulai ----------
shell(); go(location.hash.slice(1) in V ? location.hash.slice(1) : 'beranda');
if (OK) fetch(CFG.GAS_URL + '?w=pub', { mode: 'no-cors' }).catch(() => {});
setInterval(() => { if (view === 'dash' && me && scrollY < 50 && document.visibilityState === 'visible') go('dash'); }, 60000);
