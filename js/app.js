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
let bootT = 0;
function favSync() { window.setFav && setFav(Object.values((S && S.sesi) || {}).some(Boolean)); }
function loadBoot() {
  if (bootP) return bootP;
  if (Date.now() - bootT < 8000 && S.sesi && Object.keys(S.sesi).length) return Promise.resolve(true);   // hindari panggilan berulang
  bootP = api('boot').then(r => { bootP = null; if (r.success) { S = r.data; bootT = Date.now(); favSync(); try { localStorage.setItem('bk_boot', JSON.stringify(r.data)); } catch (e) {} } return r.success; });
  return bootP;
}

// ---------- Cangkang & navigasi ----------
const ICN = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', book: '<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8"/>', folder: '<path d="M3 6h6l2 2h10v11H3z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6M17 5a3 3 0 010 6M22 20c0-3-2-5-5-5.5"/>', cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3v4M17 5h4"/>',
  rocket: '<path d="M12 3c4 2 6 6 5 11l-5 4-5-4c-1-5 1-9 5-11z"/><circle cx="12" cy="10" r="1.6"/><path d="M7 15l-3 3M17 15l3 3"/>'
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICN[n] || ''}</svg>`;
const NAV_P = [['beranda', 'Beranda', 'home'], ['materi', 'Materi', 'slides'], ['baik', 'Praktik Baik', 'star'], ['absen', 'Absensi', 'check'], ['refleksi', 'Refleksi', 'chat'], ['praktik', 'Lembar Praktik', 'doc'], ['sumber', 'Sumber', 'book']];
const NAV_A = [['dash', 'Dashboard', 'chart'], ['rekap', 'Rekap', 'folder'], ['kelola', 'Kelola', 'gear']];
const TITLE = { beranda: 'Beranda', materi: 'Materi Presentasi', baik: 'Praktik Baik', absen: 'Absensi', refleksi: 'Refleksi', praktik: 'Lembar Praktik', sumber: 'Sumber Belajar', dash: 'Dashboard Admin', rekap: 'Rekap Data', kelola: 'Kelola Sumber Belajar' };
function shell() {
  $('#app').innerHTML = `<aside class="side"><div class="brand"><div class="logo">${ic('cap')}</div><div><b>BOSKIN 2026</b><small>Guru Kreatif · Siswa Aktif</small></div></div><nav>${(me ? NAV_A.concat(NAV_P) : NAV_P).map(n => `<button data-v="${n[0]}">${ic(n[2])}<span>${n[1]}</span></button>`).join('')}</nav></aside><main id="main"></main>`;
  $$('[data-v]').forEach(b => { b.onclick = () => go(b.dataset.v); b.onpointerenter = () => { if (['beranda', 'absen', 'sumber'].includes(b.dataset.v)) loadBoot(); }; });
}
async function go(v) {
  if (!V[v]) v = 'beranda'; view = v; history.replaceState(null, '', '#' + v); document.title = TITLE[v] + ' · BOSKIN 2026'; favSync();
  $$('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  $('#main').innerHTML = `<div class="top"><div><h1>${TITLE[v]}</h1><small>Merajut digitalisasi pembelajaran tanpa batas</small></div>${me ? `<div><span class="tag">${ic('users')} ${esc(me.nama || me.email)}</span> <button class="btn ghost sm" id="out">Keluar</button></div>` : '<button class="btn glow sm" id="inAdm">Masuk Admin</button>'}</div><div id="body">${SK[v] || SK.form}</div>`;
  $('#out')?.addEventListener('click', () => logout()); $('#inAdm')?.addEventListener('click', loginModal);
  await V[v]($('#body')); slider(); countUp($('#body')); window.scrollTo(0, 0);
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
    e.preventDefault(); const b = f.querySelector('button.btn'), t = b.textContent; b.disabled = true; b.classList.add('load'); b.textContent = 'Mengirim…';
    let data = Object.fromEntries(new FormData(f)); try { if (pre) data = await pre(data); } catch (er) { b.disabled = false; b.classList.remove('load'); b.textContent = t; return toast(er.message, 'err'); }
    const r = await api(action, data);
    b.disabled = false; b.classList.remove('load'); if (r.success) { b.textContent = '✓ Terkirim'; b.classList.add('ok'); setTimeout(() => { b.textContent = t; b.classList.remove('ok'); }, 1800); } else b.textContent = 'Kirim ulang';
    if (r.success) { toast(r.message || msg); localStorage.removeItem(k); f.reset(); done && done(r); } else toast(r.message || 'Gagal mengirim.', 'err');
  });
}

// ---------- Halaman peserta ----------
const HERO = [['Guru Kreatif, Siswa Aktif', 'Merajut digitalisasi pembelajaran tanpa batas bersama BOSKIN 2026.', 'cap', 'g1'], ['Absensi per sesi JP', 'Catat kehadiran cepat dari ponsel — tanpa login, tanpa rekap manual.', 'check', 'g2'], ['Bagikan karya, tularkan inspirasi', 'Kumpulkan lembar praktik dan temukan sumber belajar lewat QR Code.', 'rocket', 'g3']];
// ---------- Skeleton shimmer (ukuran sama dengan konten asli agar tidak menggeser layout) ----------
const sk = (n, h) => Array.from({ length: n }, () => `<div class="sk" style="height:${h}px"></div>`).join('');
const SK = {
  beranda: `<div class="bento"><div class="sk" style="min-height:300px;border-radius:16px"></div><div class="sk" style="min-height:300px;border-radius:20px"></div></div><div class="grid" style="margin-bottom:20px">${sk(4, 150)}</div><div class="grid g2">${sk(2, 190)}</div>`,
  dash: `<div class="grid" style="margin-bottom:20px">${sk(4, 150)}</div><div class="grid g2">${sk(2, 270)}</div>`,
  materi: `<div class="sk" style="height:38px;width:min(100%,360px);margin-bottom:14px"></div><div class="sk" style="aspect-ratio:16/9;border-radius:20px"></div>`,
  sumber: `<div class="grid g2">${sk(4, 330)}</div>`, baik: `${sk(1, 120)}${sk(1, 420)}`, tbl: `${sk(7, 46)}`,
  form: `<div class="card">${sk(1, 26)}${sk(5, 46)}</div>`
};
SK.rekap = `<div class="card">${SK.tbl}</div>`; SK.kelola = SK.form; SK.absen = SK.refleksi = SK.praktik = SK.form;
function countUp(r) {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  $$('[data-n]', r).forEach(el => {
    const m = String(el.dataset.n).match(/^([\d.]+)(.*)$/); if (!m) return;
    const to = parseFloat(m[1]), dec = (m[1].split('.')[1] || '').length, t0 = performance.now();
    const f = t => { const k = Math.min((t - t0) / 800, 1); el.textContent = (to * (1 - Math.pow(1 - k, 3))).toFixed(dec) + m[2]; if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  });
}
// ---------- Penyaji slide (template BOSKIN, kanvas 1280×720; teks bertanda *kata* disorot) ----------
const hl = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
const tw = s => { let n = 0, em = false; return String(s).split(' ').map(w => { const m = w.match(/^(\*?)(.*?)(\*?)([?.,!:;]*)$/); if (m[1]) em = true; const h = `<span class="w${em ? ' em' : ''}" style="--w:${n++}">${esc(m[2] + m[4])}</span>`; if (m[3]) em = false; return h; }).join(' '); };
const ib = (key, label) => `<button class="ib" data-info="${key}" aria-label="Penjelasan dan contoh: ${esc(label)}" title="Lihat penjelasan dan contoh">i</button>`;
const ORB = '<i class="orb o1"></i><i class="orb o2"></i>';
const SLP = {
  hd: s => `<div class="hd"><img src="img/emblem.png" alt="Logo Tut Wuri Handayani" decoding="async"><div class="tt"><h2>${tw(s.judul)}</h2>${s.sub ? `<p>${esc(s.sub)}</p>` : ''}</div><img class="strip" src="img/strip.png" alt="" decoding="async"></div>`,
  ft: f => !f ? '' : `<div class="ft">${f.gold ? `<span class="gold">${esc(f.gold)}</span>` : f.pill ? `<span class="pill2">${esc(f.pill)}</span>` : `<span class="ftx${f.kecil ? ' sm' : ''}">${hl(f.teks || f.kecil)}</span>`}</div>`,
  card: (i, top, k) => `<div class="cd${top ? ' tp' : ''} c${i.c || 0}" style="--i:${k}"${i.n ? ` data-wm="${esc(i.n)}"` : ''}>${i.info ? ib(i.info, i.k) : ''}${i.n ? `<div class="num">${esc(i.n)}</div>` : ''}${i.tag ? `<div class="trow"><span class="pill">${esc(i.tag)}</span>${i.url ? `<button class="pvbtn" data-pi="${k}">▶ Pratinjau</button>` : ''}</div>` : ''}<b>${esc(i.k)}</b>${i.x ? `<p${i.q ? ' class="q"' : ''}>${hl(i.x)}</p>` : ''}${i.chips ? `<div class="chips">${i.chips.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}${i.y ? `<p class="y">${hl(i.y)}</p>` : ''}${i.poin ? `<div class="ex"><small>${esc(i.exl || 'Contoh')}</small><ul class="pl">${i.poin.map(x => `<li><span class="tg">${esc(x[0])}</span> ${hl(x[1])}</li>`).join('')}</ul></div>` : i.contoh ? `<div class="ex"><small>${esc(i.exl || 'Contoh')}</small><p>${hl(i.contoh)}</p></div>` : ''}</div>`
};
function slideHTML(s) {
  const gy = s.gaya ? ' ' + s.gaya : '';
  if (s.t === 'cover') return `<div class="sl cover">${ORB}<img class="wm" src="img/wordmark.png" alt="Kemendikdasmen"><h1>${tw(s.judul)}</h1><div class="cvf"><b>${esc(s.sub)}</b><span>${esc(s.sub2)}</span></div></div>`;
  if (s.t === 'close') return `<div class="sl">${ORB}${SLP.hd(s)}<div class="bd"><div class="big">${s.teks.map((x, k) => `<p style="--i:${k}">${hl(x)}</p>`).join('')}</div></div><div class="ft"><span class="gold">${esc(s.tombol)}</span></div></div>`;
  let bd = '';
  if (s.t === 'cards') bd = `<div class="g${gy}" style="--cols:${s.kolom}">${s.items.map((i, k) => SLP.card(i, 0, k)).join('')}</div>`;
  else if (s.t === 'cols3' || s.t === 'cols5') bd = `<div class="g${gy}" style="--cols:${s.items.length}">${s.items.map((i, k) => SLP.card(i, 1, k)).join('')}</div>`;
  else if (s.t === 'rows') bd = `<div class="rows${gy}" style="--st:${s.items.length < 4 ? 56 : 34}px">${s.items.map((i, k) => `<div class="rw c${i.c || 0}" style="--i:${k}"><span class="rn">${esc(i.n) || ''}</span><b>${esc(i.k)}</b><p>${hl(i.x || '')}</p></div>`).join('')}</div>`;
  else if (s.t === 'duo') { const L = s.panels[0], R = s.panels[1];
    bd = `<div class="g duo" style="--cols:2"><div class="cd pn c0" style="--i:0"><b class="ph">${esc(L.k)}</b><div class="prin">${L.prin.map(p => `<div class="pr"><span class="dot"></span><div><strong>${esc(p.k)}</strong><small>${esc(p.en)}</small></div>${ib(p.info, p.k)}</div>`).join('')}</div><div class="sh">${esc(L.langkah.judul)}</div><div class="steps">${L.langkah.items.map((x, n) => `<div class="st"><span class="sn">${n + 1}</span><strong>${esc(x.k)}</strong>${ib(x.info, x.k)}</div>`).join('')}</div></div>
    <div class="cd pn c1" style="--i:1"><b class="ph">${esc(R.k)}</b>${R.def ? `<p class="def">${hl(R.def)}</p>` : ''}${R.baris.map(r => `<div class="tr ${r.cl}"><span class="tb">${esc(r.b)}</span><div><strong>${esc(r.k)}</strong><p>${esc(r.x)}</p></div>${ib(r.info, r.k)}</div>`).join('')}<div class="core" data-info="${R.inti.info}" role="button" tabindex="0">${ic('spark')}<span>${hl(R.inti.teks)}</span>${ib(R.inti.info, 'TPACK')}</div></div></div>`; }
  else if (s.t === 'exp') bd = `<div class="xp"><div class="xl">${s.items.map((i, k) => `<div class="xr c${i.c || 0}" style="--i:${k}">${ib(i.info, i.k)}<span class="xn">${esc(i.n)}</span><div class="xm"><div class="xt"><b>${esc(i.k)}</b><span>${esc(i.x)}</span>${i.ases ? `<span class="at">${esc(i.ases)}</span>` : ''}</div><div class="chips">${i.chips.map(c => `<span>${esc(c)}</span>`).join('')}</div><div class="ex"><small>Contoh: Dunia Digital Aman</small><p>${hl(i.contoh)}</p></div></div></div>`).join('')}</div><div class="phone"><iframe src="${safeUrl(s.media.url)}" title="Pratinjau ${esc(s.media.title)}" loading="lazy" referrerpolicy="no-referrer"></iframe><button class="pvb in" data-url="${esc(s.media.url)}" data-title="${esc(s.media.title)}">⤢ Perbesar</button></div></div>`;
  else if (s.t === 'chk') bd = `<div class="g" style="--cols:2">${s.daftar.map((d, k) => `<div class="cd ck c${k}" style="--i:${k}"><div class="ckh"><span class="ckn">${k + 1}</span><b>${esc(d.k)}</b></div><div class="ex"><small>Contoh: Dunia Digital Aman</small><p>${hl(d.contoh)}</p></div></div>`).join('')}</div>`;
  else if (s.t === 'cols') bd = `<div class="g" style="--cols:2">${s.panels.map((p, k) => `<div class="cd pn c${p.c || 0}" style="--i:${k}"><b>${esc(p.k)}</b>${p.isi.map(l => Array.isArray(l) ? `<p class="blk"><strong>${esc(l[0])}</strong><span>${esc(l[1])}</span></p>` : l ? `<p>${esc(l)}</p>` : '<br>').join('')}</div>`).join('')}</div>`;
  else if (s.t === 'hero') bd = `<div class="hero2"><h3>${esc(s.kartu.k)}</h3><p>${esc(s.kartu.x)}</p><a class="btn2" href="${safeUrl(s.kartu.url)}" target="_blank" rel="noopener">${esc(s.kartu.tombol)}</a></div>`;
  else if (s.t === 'panel') bd = `<div class="pnl"><b>${esc(s.panel.k)}</b><ul>${s.panel.daftar.map((d, k) => `<li style="--i:${k}">${esc(d)}</li>`).join('')}</ul><span class="gold r">${esc(s.panel.tombol)}</span></div>`;
  const ab = s.abtn ? `<button class="abt" data-info="${s.abtn.info}">${ic('spark')} ${esc(s.abtn.label)}</button>` : '';
  const pv = s.prev ? `<button class="pvb" data-url="${esc(s.prev.url)}" data-title="${esc(s.prev.title)}">${ic('slides')} Lihat media contoh</button>` : '';
  return `<div class="sl">${ORB}${SLP.hd(s)}<div class="bd">${bd}</div>${SLP.ft(s.foot)}${pv}${ab}</div>`;
}
// Sesuaikan ukuran otomatis agar teks tidak meluap, apa pun font yang dipilih
function infoHTML(k) {
  const d = ((window.MATERI || {}).info || {})[k]; if (!d) return '';
  const tbl = r => `<table class="pt2"><tr>${r[0].map(h => `<th>${esc(h)}</th>`).join('')}</tr>${r.slice(1).map(row => `<tr>${row.map((c, j) => `<td${j === 0 ? ' class="r0"' : ''}>${hl(c)}</td>`).join('')}</tr>`).join('')}</table>`;
  const dense = !!(d.bagian && d.bagian.some(x => x[2]));
  const one = x => `<div class="pb"><b>${esc(x[0])}</b><p>${hl(x[1])}</p>${x[2] ? tbl(x[2]) : ''}</div>`;
  const sec = d.bagian ? (dense ? d.bagian.filter(x => x[2]).map(one).join('') + `<div class="pcols">${d.bagian.filter(x => !x[2]).map(one).join('')}</div>` : d.bagian.map(one).join('')) : `<div class="pb"><b>Penjelasan</b><p>${hl(d.p)}</p></div>`;
  const ft = (d.balik ? `<button class="more back" data-info="${d.balik}">← Kembali</button>` : '') + (d.lanjut || []).map(x => `<button class="more" data-info="${x[1]}">${esc(x[0])} →</button>`).join('');
  return `<div class="popw"><div class="pop${d.bagian ? ' long' : ''}${dense ? ' dense' : ''}" role="dialog" aria-label="${esc(d.k)}"><button class="px" aria-label="Tutup">✕</button><span class="pt">${esc(d.tag)}</span><h3>${esc(d.k)}</h3>${sec}<div class="pb ex"><b>Contoh</b><p>${hl(d.c)}</p></div>${ft ? `<div class="pfoot">${ft}</div>` : ''}</div></div>`;
}
function previewHTML(list, k) {
  const it = list[k], u = safeUrl(it.url);
  return `<div class="popw"><div class="pvw" role="dialog" aria-label="Pratinjau ${esc(it.title)}"><div class="pvh"><b>${esc(it.title)}</b>${list.length > 1 ? `<span class="pvc">${k + 1}/${list.length}</span><button class="pvn" data-d="-1" aria-label="Karya sebelumnya">‹</button><button class="pvn" data-d="1" aria-label="Karya berikutnya">›</button>` : ''}<a class="pvo" href="${u}" target="_blank" rel="noopener">Buka di tab baru ↗</a><button class="px" aria-label="Tutup">✕</button></div><div class="pvf"><iframe src="${u}" title="Pratinjau ${esc(it.title)}" referrerpolicy="no-referrer"></iframe></div>${it.note ? `<div class="pvt">${esc(it.note)}</div>` : ''}</div></div>`;
}
function fitAll(cv) {
  $$('.sl h2', cv).forEach(h => { h.style.fontSize = ''; let s = parseFloat(getComputedStyle(h).fontSize); while (h.offsetHeight > 96 && s > 24) { s -= 2; h.style.fontSize = s + 'px'; } });
  $$('.cd,.rw,.pnl,.xr', cv).forEach(c => { c.style.fontSize = ''; let s = parseFloat(getComputedStyle(c).fontSize); while ((c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1) && s > 12) { s -= 1; c.style.fontSize = s + 'px'; } });
}
const FONTS = [['luwes', 'Luwes'], ['modern', 'Modern'], ['elegan', 'Elegan'], ['ramah', 'Ramah'], ['asli', 'Template']];
function loadDeckFonts(cb) {   // font slide dimuat hanya saat halaman Materi dibuka
  if (!document.getElementById('dkf')) { const l = document.createElement('link'); l.id = 'dkf'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Fraunces:wght@600;700;800&family=Poppins:wght@500;600;700&family=Figtree:wght@500;600;700;800&display=swap'; l.onload = () => document.fonts && document.fonts.ready.then(cb); document.head.appendChild(l); }
}
const alatHTML = () => {
  const A = (window.MATERI && MATERI.alat) || []; if (!A.length) return '';
  return `<section class="alat"><div class="alat-h"><span class="tag">${ic('spark')} Generator Modul Ajar</span><h2>Susun RPP &amp; Modul Ajar dengan bantuan AI</h2><p class="mu">Alat bantu berbasis Gemini. Isi data kelas Anda, lalu periksa dan sesuaikan hasilnya sebelum dipakai. Tautan dibuka lewat Gemini dan mungkin meminta masuk dengan akun Google.</p></div>
  <div class="grid g2" style="margin-bottom:28px">${A.map((a, i) => `<article class="card alat-c c${i}"><div class="alat-i">${ic(a.ikon)}</div><h3>${esc(a.k)}</h3><p class="mu">${esc(a.x)}</p><div class="qr" data-u="${esc(a.url)}"></div><div class="row"><a class="btn glow" href="${safeUrl(a.url)}" target="_blank" rel="noopener">Buka Generator ↗</a><button class="btn ghost" data-copy="${esc(a.url)}">Salin</button></div></article>`).join('')}</div></section><h2>Koleksi Sumber Belajar</h2>`;
};

const V = {
  async beranda(b) {
    const QA = [['absen', 'Absensi', 'check', 2, 'Pilih sesi JP lalu kirim presensi.'], ['refleksi', 'Refleksi', 'chat', 4, 'Tuliskan refleksi dan tindak lanjut.'], ['praktik', 'Lembar Praktik', 'doc', 3, 'Kumpulkan tautan atau berkas hasil praktik.'], ['sumber', 'Sumber Belajar', 'book', 1, 'Tautan karya, materi, dan QR Code.']];
    let first = true;
    const draw = () => {
      b.classList.toggle('nr', !first); first = false; favSync();
      const ss = S.sesi || {}, L = (S.sumber || []).slice(-3).reverse(), n = (window.MATERI || { slides: [] }).slides.length;
      b.innerHTML = `<div class="bento"><div class="hero b-hero"><div class="slides" data-ms="5500">${HERO.map(h => `<div class="slide ${h[3]}"><h1>${h[0]}</h1><p>${h[1]}</p><span class="em">${ic(h[2])}</span></div>`).join('')}</div>${dots(HERO.length)}<div class="hero-cta"><button class="btn glow" data-go="absen">Mulai Absen</button><button class="btn ghost" data-go="materi">Lihat Materi</button></div></div>
      <div class="card"><h2>Status Sesi Hari Ini</h2>${[1, 2, 3].map(k => `<div class="sw"><div><b>JP ${k}</b><br><small>${JP[k]} WIB</small></div><span class="pillst ${ss[k] ? 'on' : ''}">${ss[k] ? '● Dibuka' : 'Ditutup'}</span></div>`).join('')}</div></div>
      <div class="grid" style="margin-bottom:20px">${QA.map(q => `<button class="card qa" data-go="${q[0]}"><span class="tile t${q[3]}">${ic(q[2])}</span><b>${q[1]}</b><small>${q[4]}</small></button>`).join('')}</div>
      <div class="grid g2"><div class="card"><span class="tag">Materi Presentasi</span><h2 style="margin-top:8px">Digitalisasi Pembelajaran</h2><p class="mu">${n} slide · 105 menit · dari penggunaan teknologi menuju pengalaman belajar yang bermakna.</p><div class="row" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn glow" data-go="materi">Buka Materi</button><button class="btn ghost" data-go="baik">Praktik Baik</button></div></div>
      <div class="card"><h2>Sumber Belajar Terbaru</h2>${L.map(s => `<div class="sw"><div><b>${esc(s.judul)}</b><br><small>${esc(s.jenis)}</small></div><a class="btn ghost sm" href="${safeUrl(s.tautan)}" target="_blank" rel="noopener">Buka</a></div>`).join('') || '<p class="mu">Belum ada sumber.</p>'}</div></div>`;
      $$('[data-go]', b).forEach(c => c.onclick = () => go(c.dataset.go)); slider();
    };
    let c = null; try { c = JSON.parse(localStorage.getItem('bk_boot') || 'null'); } catch (e) {}
    if (c) { S = c; draw(); } else b.innerHTML = SK.beranda;
    const h0 = JSON.stringify(c); await loadBoot(); if (!c || JSON.stringify(S) !== h0) draw();
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
    let first = true; const draw = () => { b.classList.toggle('nr', !first); first = false; const L = S.sumber || []; b.innerHTML = alatHTML() + (L.length ? `<div class="grid g2">${L.map(cardSumber).join('')}</div>` : '<div class="card">Belum ada sumber belajar.</div>'); $$('.qr', b).forEach(q => window.QRCode && new QRCode(q, { text: q.dataset.u, width: 88, height: 88, colorDark: '#431fb8' })); slider(); };
    let c = null; try { c = JSON.parse(localStorage.getItem('bk_boot') || 'null'); } catch (e) {}
    if (c && c.sumber) { S = c; draw(); }
    const h0 = JSON.stringify(c && c.sumber); await loadBoot();
    if (!c || JSON.stringify(S.sumber) !== h0) draw();
  },
  async materi(b) {
    const M = window.MATERI; if (!M) return b.innerHTML = '<div class="card">Materi belum termuat.</div>';
    const N = M.slides.length; let i = Math.min(+(localStorage.getItem('bk_sl') || 0), N - 1), tab = 'slide';
    b.innerHTML = `<div class="tabs">${[['slide', 'Slide'], ['waktu', 'Jadwal 105 menit'], ['siap', 'Persiapan']].map(x => `<button data-t="${x[0]}">${x[1]}</button>`).join('')}</div><div id="mv"></div>`;
    const mv = $('#mv', b); let ctl = null; let fnt = Math.max(0, FONTS.findIndex(f => f[0] === localStorage.getItem('bk_font')));
    loadDeckFonts(() => { const c = $('#cv', mv); c && fitAll(c); });
    const paint = () => {
      $$('[data-t]', b).forEach(x => x.classList.toggle('on', x.dataset.t === tab)); ctl = null;
      if (tab === 'slide') slideTab(); else if (tab === 'waktu') mv.innerHTML = `<div class="card"><h2>Pembagian waktu — 3 JP (105 menit)</h2>${M.waktu.map(w => `<div class="sw"><div style="flex:1"><b>${esc(w[0])}</b><div class="prog" style="margin:6px 0 0"><i style="width:${w[2] / 20 * 100}%"></i></div></div><span class="tag">${esc(w[1])}</span></div>`).join('')}<div class="sw"><b>Total</b><span class="tag">105 menit</span></div></div>`;
      else {
        let ck = []; try { ck = JSON.parse(localStorage.getItem('bk_ck') || '[]'); } catch (e) {}
        mv.innerHTML = `<div class="card"><h2>Checklist persiapan <span class="tag">${ck.length}/${M.siap.length} siap</span></h2><div class="prog"><i style="width:${ck.length / M.siap.length * 100}%"></i></div>${M.siap.map((x, k) => `<label class="chk"><input type="checkbox" data-c="${k}" ${ck.includes(k) ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('')}</div>`;
        $$('[data-c]', mv).forEach(x => x.onchange = () => { const k = +x.dataset.c; ck = x.checked ? ck.concat(k) : ck.filter(y => y !== k); localStorage.setItem('bk_ck', JSON.stringify(ck)); paint(); });
      }
    };
    // Panggung dibuat SEKALI; pergantian slide hanya mengganti isi kanvas, sehingga layar penuh tidak pernah terlepas.
    const slideTab = () => {
      mv.innerHTML = `<div class="stg" id="stg" data-font="${FONTS[fnt][0]}"><div class="fr" id="fr"><div class="cv" id="cv"></div><button class="nv l" data-d="-1" aria-label="Slide sebelumnya">‹</button><button class="nv r" data-d="1" aria-label="Slide berikutnya">›</button></div>
      <div class="bar"><button class="bb" data-d="-1" aria-label="Sebelumnya">‹</button><span class="ct" id="ct"></span><div class="pg"><i id="pgi"></i></div><button class="bb" data-d="1" aria-label="Berikutnya">›</button><button class="bb wide" id="fnt"></button><button class="bb wide" id="fs">⛶ Layar penuh</button></div></div>
      <p class="mu hint">Di ponsel: ketuk “Layar penuh”, lalu putar ke mode lanskap. Geser kiri/kanan atau pakai tombol panah untuk berpindah slide.</p>
      <div id="nts"></div><div class="thumbs">${M.slides.map((x, k) => `<button class="th" data-k="${k}"><b>${k + 1}</b>${esc(x.judul)}</button>`).join('')}</div>`;
      const stg = $('#stg', mv), fr = $('#fr', mv), cv = $('#cv', mv); let hide = 0;
      const fit = () => cv.style.setProperty('--s', fr.clientWidth / 1280);
      new ResizeObserver(fit).observe(fr); fit();
      const fntLabel = () => { $('#fnt', mv).textContent = 'Aa · ' + FONTS[fnt][1]; };
      const cycleFont = () => { fnt = (fnt + 1) % FONTS.length; stg.dataset.font = FONTS[fnt][0]; localStorage.setItem('bk_font', FONTS[fnt][0]); fntLabel(); requestAnimationFrame(() => fitAll(cv)); };
      const closeInfo = () => $$('.popw', cv).forEach(x => x.remove());
      let cur = null;
      const openInfo = k => { const sl = cv.firstElementChild; closeInfo(); sl && sl.insertAdjacentHTML('beforeend', infoHTML(k)); };
      const openPrev = (list, k) => { const sl = cv.firstElementChild; closeInfo(); if (!sl) return; cur = { list, k }; sl.insertAdjacentHTML('beforeend', previewHTML(list, k)); };
      cv.addEventListener('click', e => {
        if (e.target.closest('.px') || e.target.classList.contains('popw')) return closeInfo();
        const pn = e.target.closest('.pvn'); if (pn && cur) { e.stopPropagation(); return openPrev(cur.list, (cur.k + (+pn.dataset.d) + cur.list.length) % cur.list.length); }
        const pb = e.target.closest('.pvb'); if (pb) { e.stopPropagation(); return openPrev([{ title: pb.dataset.title, url: pb.dataset.url }], 0); }
        const pv = e.target.closest('.pvbtn'); if (pv) { e.stopPropagation(); return openPrev(M.slides[i].items.map(x => ({ title: x.k, url: x.url, note: x.note })), +pv.dataset.pi); }
        const ibn = e.target.closest('[data-info]'); if (ibn) { e.stopPropagation(); openInfo(ibn.dataset.info); return; }
        if (e.target.closest('.pop,.pvw')) return;
        const c = e.target.closest('.cd,.rw'); if (!c || e.target.closest('a')) return; const g = c.parentElement, was = c.classList.contains('on'); $$('.on', g).forEach(x => x.classList.remove('on')); g.classList.toggle('focus', !was); if (!was) c.classList.add('on'); });   // klik kartu = sorot poin
      const show = (k, dir = 1) => {
        i = (k + N) % N; localStorage.setItem('bk_sl', i); const s = M.slides[i];
        cv.innerHTML = slideHTML(s); cv.firstElementChild.classList.add(dir > 0 ? 'an' : 'ap'); fitAll(cv);
        $('#ct', mv).textContent = `${i + 1} / ${N}`; $('#pgi', mv).style.width = (i + 1) / N * 100 + '%';
        $$('.th', mv).forEach((x, n) => x.classList.toggle('on', n === i));
        $('#nts', mv).innerHTML = me ? `<details class="card nts"><summary>Narasi pemateri — slide ${i + 1}</summary><p>${esc(s.narasi)}</p>${s.catatan ? `<p class="mu"><b>Catatan:</b> ${esc(s.catatan)}</p>` : ''}</details>` : '';
      };
      const step = d => show(i + d, d);
      const isFs = () => document.fullscreenElement === stg || stg.classList.contains('pfs');
      const upd = () => { $('#fs', mv).textContent = isFs() ? '✕ Keluar layar penuh' : '⛶ Layar penuh'; setTimeout(fit, 50); };
      const toggleFs = () => {
        if (isFs()) { stg.classList.remove('pfs'); if (document.fullscreenElement) document.exitFullscreen(); upd(); return; }
        const rq = stg.requestFullscreen || stg.webkitRequestFullscreen;
        if (rq) { try { Promise.resolve(rq.call(stg)).catch(() => { stg.classList.add('pfs'); upd(); }); } catch (e) { stg.classList.add('pfs'); upd(); } } else { stg.classList.add('pfs'); upd(); }
      };
      $$('[data-d]', mv).forEach(x => x.onclick = () => { step(+x.dataset.d); x.blur(); });
      $('#fs', mv).onclick = e => { toggleFs(); e.currentTarget.blur(); };
      $('#fnt', mv).onclick = e => { cycleFont(); e.currentTarget.blur(); };
      $$('.th', mv).forEach(x => x.onclick = () => show(+x.dataset.k, +x.dataset.k >= i ? 1 : -1));
      const wake = () => { stg.classList.add('show'); clearTimeout(hide); hide = setTimeout(() => stg.classList.remove('show'), 2500); };
      ['mousemove', 'touchstart', 'click'].forEach(ev => stg.addEventListener(ev, wake, { passive: true }));
      let x0 = null; fr.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
      fr.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
      document.onfullscreenchange = () => { upd(); wake(); };
      document.onkeydown = e => {
        if (view !== 'materi' || tab !== 'slide' || /INPUT|TEXTAREA|SELECT|SUMMARY/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key, nx = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'], pv = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];
        if (k === 'Enter' && /A|BUTTON/.test(e.target.tagName)) return;
        if (nx.includes(k)) { e.preventDefault(); step(1); } else if (pv.includes(k)) { e.preventDefault(); step(-1); }
        else if (k === 'Home') { e.preventDefault(); show(0, -1); } else if (k === 'End') { e.preventDefault(); show(N - 1, 1); }
        else if (k === 'f' || k === 'F') { e.preventDefault(); toggleFs(); }
        else if (k === 't' || k === 'T') { e.preventDefault(); cycleFont(); }
        else if (k === 'Escape' && $('.popw', cv)) { closeInfo(); } else if (k === 'Escape' && stg.classList.contains('pfs')) { stg.classList.remove('pfs'); upd(); }
        else return; wake();
      };
      ctl = show; fntLabel(); show(i, 1); upd();
    };
    $$('[data-t]', b).forEach(x => x.onclick = () => { tab = x.dataset.t; paint(); });
    paint();
  },
  async baik(b) {
    const M = window.MATERI || { karya: [] }, Z = 'https://zlfdnt.github.io/zulfaspace/';
    b.innerHTML = `<div class="card"><div class="spot-h"><div><span class="tag">Berbagi Praktik Baik</span><h2 style="margin-top:8px">ZulfaSpace — Digital Learning Portfolio</h2><p class="mu" style="margin:0">Ruang dokumentasi dan eksplorasi karya pembelajaran matematika dan koding interaktif.</p></div><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><a class="btn glow" href="${Z}" target="_blank" rel="noopener">Buka ZulfaSpace ↗</a><div class="qr" id="qz"></div></div></div><div class="frame"><iframe src="${Z}" title="Pratinjau ZulfaSpace" loading="lazy" referrerpolicy="no-referrer"></iframe></div></div>
    <h2>Enam Karya, Enam Pengalaman Belajar</h2><div class="grid">${M.karya.map(k => `<div class="card"><span class="tag">${esc(k[1])}</span><h3>${esc(k[0])}</h3><p class="mu" style="margin:0">${esc(k[2])}</p>${k[3] ? `<div style="margin-top:12px"><a class="btn ghost sm" href="${safeUrl(k[3])}" target="_blank" rel="noopener">Buka ↗</a></div>` : ''}</div>`).join('')}</div>${me ? '<p class="mu">Catatan admin: keterangan karya diambil dari judul dan deskripsi masing-masing laman; sesuaikan bila perlu di js/materi.js.</p>' : ''}`;
    window.QRCode && new QRCode($('#qz', b), { text: Z, width: 88, height: 88, colorDark: '#431fb8' });
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
    b.innerHTML = `<div class="grid" style="margin-bottom:20px">${[['Total Peserta', d.peserta, 'users', 1], ['Hadir Hari Ini', pct + '%', 'check', 2], ['Refleksi Masuk', d.refleksi, 'chat', 4], ['Lembar Praktik', d.praktik, 'doc', 3]].map(s => `<div class="card stat"><span class="tile t${s[3]}">${ic(s[2])}</span><small class="lb">${s[0]}</small><b data-n="${s[1]}">${s[1]}</b></div>`).join('')}</div>
    <div class="grid g2"><div class="card"><h2>Tren Kehadiran per Sesi JP</h2><svg viewBox="0 0 360 160" width="100%" role="img" aria-label="Grafik kehadiran"><line x1="30" x2="350" y1="${Y(P * .95)}" y2="${Y(P * .95)}" stroke="#2EC97A" stroke-dasharray="5 4"/><text x="352" y="${Y(P * .95) - 4}" font-size="9" fill="#2EC97A" text-anchor="end">Target 95%</text><polyline class="ln" pathLength="1" points="${pts}" fill="none" stroke="#5B3FD0" stroke-width="3" stroke-linejoin="round"/>${H.map((v, i) => `<circle cx="${X[i]}" cy="${Y(v)}" r="5" fill="#fff" stroke="#5B3FD0" stroke-width="3"/><text x="${X[i]}" y="${Y(v) - 10}" font-size="11" text-anchor="middle" font-weight="700">${v}</text><text x="${X[i]}" y="152" font-size="11" text-anchor="middle" fill="#64748B">JP ${i + 1}</text>`).join('')}</svg></div>
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
    const load = async () => { $$('[data-tab]', b).forEach(x => x.classList.toggle('on', x.dataset.tab === tab)); $('#tb', b).innerHTML = SK.tbl; let r; if (PRE[tab]) { r = { success: true, data: PRE[tab] }; delete PRE[tab]; } else r = await api('admin.rekap', { tab }); rows = r.success ? r.data : []; if (!r.success) toast(r.message, 'err'); draw(); };
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
  const im = (s.gambar || '').split('|').filter(u => /^https:\/\//.test(u)), em = [ic('book'), ic('star'), ic('slides')], gr = ['g1', 'g2', 'g3'];
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
document.addEventListener('pointermove', e => {
  const o = e.target; if (!o.closest) return;
  const c = o.closest('.card,.hero'); if (c) { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); }
  const k = o.closest('.qa,.sc,.stat'); if (k && e.pointerType === 'mouse') { const r = k.getBoundingClientRect(); k.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg'); k.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 8 + 'deg'); }
}, { passive: true });
document.addEventListener('pointerout', e => { const k = e.target.closest && e.target.closest('.qa,.sc,.stat'); if (k && !k.contains(e.relatedTarget)) { k.style.setProperty('--rx', '0deg'); k.style.setProperty('--ry', '0deg'); } });
document.addEventListener('pointerdown', e => {   // efek riak pada tombol
  const b = e.target.closest && e.target.closest('.btn,.bb,.th,.tabs button,.jpb'); if (!b || b.disabled || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, s = document.createElement('span'); s.className = 'rp';
  s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`; b.appendChild(s); setTimeout(() => s.remove(), 650);
}, { passive: true });
addEventListener('scroll', () => document.body.classList.toggle('scr', scrollY > 8), { passive: true });
document.addEventListener('click', e => { const c = e.target.closest('[data-copy]'); if (c) navigator.clipboard.writeText(c.dataset.copy).then(() => toast('Tautan disalin.'), () => toast('Gagal menyalin.', 'err')); });
// Kursor "+" berpartikel: kanvas hanya digambar saat ada gerakan/partikel (hemat CPU & baterai)
(function () {
  if (matchMedia('(pointer:coarse)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const c = document.createElement('canvas'); c.id = 'fx'; document.body.appendChild(c); const x = c.getContext('2d');
  let W, H, m = { x: -99, y: -99 }, P = [], on = false, last = 0;
  const draw = () => {
    x.clearRect(0, 0, W, H); P = P.filter(p => p.l > 0);
    P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .01; p.l -= .022; x.globalAlpha = Math.max(p.l, 0); x.fillStyle = `hsl(${p.h},85%,62%)`; x.shadowColor = x.fillStyle; x.shadowBlur = 8; x.beginPath(); x.arc(p.x, p.y, Math.max(p.s * p.l, 0.1), 0, 7); x.fill(); });
    x.globalAlpha = 1; x.shadowBlur = 0; x.lineCap = 'round';
    [['#fff', 5], ['#431fb8', 2]].forEach(a => { x.strokeStyle = a[0]; x.lineWidth = a[1]; x.beginPath(); x.moveTo(m.x - 7, m.y); x.lineTo(m.x + 7, m.y); x.moveTo(m.x, m.y - 7); x.lineTo(m.x, m.y + 7); x.stroke(); });
  };
  const loop = () => { draw(); if (P.length || performance.now() - last < 300) requestAnimationFrame(loop); else on = false; };
  const kick = () => { last = performance.now(); if (!on) { on = true; requestAnimationFrame(loop); } };
  const rs = () => { W = c.width = innerWidth; H = c.height = innerHeight; kick(); }; rs(); addEventListener('resize', rs);
  addEventListener('mousemove', e => { m.x = e.clientX; m.y = e.clientY; for (let i = 0; i < 2; i++) P.push({ x: m.x, y: m.y, vx: (Math.random() - .5) * 1.8, vy: (Math.random() - .5) * 1.8 - .3, l: 1, s: Math.random() * 2.4 + .8, h: 250 + Math.random() * 50 }); if (P.length > 160) P.splice(0, P.length - 160); kick(); }, { passive: true });
  document.addEventListener('mouseleave', () => { m.x = m.y = -99; kick(); });
  document.documentElement.classList.add('nocursor');
})();

// Favicon interaktif: titik hijau saat ada sesi JP dibuka; berkedip + judul tab "●" bila tab sedang di latar
(function () {
  const L = document.querySelector('link[rel=icon]'); if (!L) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); if (!x) return;
  const cap = new Path2D('M32 14 8 26l24 12 24-12z'), base = new Path2D('M18 34v10c8 6 20 6 28 0V34l-14 7z');
  let open = false, blink = false, last = '';
  const draw = dot => {
    x.clearRect(0, 0, 64, 64); const g = x.createLinearGradient(0, 0, 64, 64); g.addColorStop(0, '#431fb8'); g.addColorStop(1, '#7B5CF0');
    x.fillStyle = g; x.beginPath(); x.roundRect ? x.roundRect(0, 0, 64, 64, 16) : x.rect(0, 0, 64, 64); x.fill();
    x.fillStyle = '#fff'; x.fill(cap); x.globalAlpha = .9; x.fill(base); x.globalAlpha = 1;
    x.strokeStyle = '#FFC24A'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(54, 27); x.lineTo(54, 41); x.stroke(); x.fillStyle = '#FFC24A'; x.beginPath(); x.arc(54, 44, 3, 0, 7); x.fill();
    if (dot) { x.fillStyle = '#fff'; x.beginPath(); x.arc(49, 15, 12, 0, 7); x.fill(); x.fillStyle = '#2EC97A'; x.beginPath(); x.arc(49, 15, 9, 0, 7); x.fill(); }
    const u = cv.toDataURL('image/png'); if (u !== last) { last = u; L.type = 'image/png'; L.href = u; }
  };
  const title = () => { const b = document.title.replace(/^● /, ''); document.title = (open && document.hidden && blink ? '● ' : '') + b; };
  window.setFav = o => { o = !!o; if (o === open) return; open = o; blink = false; draw(open); title(); };
  setInterval(() => { if (!open) return; if (document.hidden) { blink = !blink; draw(blink); } else if (blink) { blink = false; draw(true); } title(); }, 900);
  document.addEventListener('visibilitychange', () => { blink = false; if (open) draw(true); title(); });
})();
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// ---------- Mulai ----------
shell(); go(location.hash.slice(1) in V ? location.hash.slice(1) : 'beranda');
if (OK) fetch(CFG.GAS_URL + '?w=pub', { mode: 'no-cors' }).catch(() => {});
setInterval(() => { if (view === 'dash' && me && scrollY < 50 && document.visibilityState === 'visible') go('dash'); }, 60000);
