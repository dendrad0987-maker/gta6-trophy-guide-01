// Leonida Legend — GTA VI trophy guide and tracker.
// Static, offline: the only file it loads is data/trophies.json (same folder).
// Progress lives in localStorage; export/import move it as JSON.
const STORAGE_KEY = 'leonida-legend-progress-v1';
const STAGES = [
  { n: 1, title: 'Story first', text: 'Chapters 1–4 and the final mission. 12 trophies, none missable.' },
  { n: 2, title: 'Strangers & side strands', text: '8 stranger strands, incl. Andy, Kenton, Billy, Randy, Tyrone.' },
  { n: 3, title: 'Activities & skills', text: 'Races, shooting range, fishing, stunts, heists and partner moments.' },
  { n: 4, title: 'Collectibles & counts', text: 'Cards, WAiNK It, vehicles, meditation spots, garages, money.' },
  { n: 5, title: 'Cleanup & 100%', text: '100% completion, then the platinum pops automatically.' },
];

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

let earned = loadEarned();
let kind = params.get('filter') ?? 'all';
let grade = params.get('grade') ?? 'all';
let spoiler = params.get('spoiler') === '1';
let earnedOnly = false;
let query = params.get('q') ?? '';
let selectedId = Number(params.get('open') ?? '') || null;

const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');

function loadEarned() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    const set = new Set(saved.filter((id) => trophies.some((t) => t.id === id)));
    if (params.get('earned')) {
      for (const part of params.get('earned').split(',')) {
        const id = Number(part);
        if (Number.isInteger(id)) set.add(id);
      }
    }
    return set;
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function isSpoilerHidden(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}

function visibleTrophies() {
  const q = query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kind === 'missable' && !t.missable) return false;
    if (kind === 'online') return false; // The official list has no online trophies.
    if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) return false;
    if (grade !== 'all' && t.grade !== grade) return false;
    if (earnedOnly && !earned.has(t.id)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function gradeBadge(t) {
  const span = document.createElement('span');
  span.className = 'grade-badge grade-' + t.grade;
  span.textContent = t.grade;
  return span;
}

function tagList(t) {
  const wrap = document.createElement('div');
  wrap.className = 'tags';
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = t.kind;
  wrap.append(kindTag);
  if (t.missable) {
    const miss = document.createElement('span');
    miss.className = 'tag missable';
    miss.textContent = 'Missable';
    wrap.append(miss);
  }
  const stageTag = document.createElement('span');
  stageTag.className = 'tag';
  stageTag.textContent = 'Roadmap stage ' + t.stage;
  wrap.append(stageTag);
  return wrap;
}

function renderRoadmap() {
  const list = document.getElementById('stages');
  list.replaceChildren();
  for (const s of STAGES) {
    const inStage = trophies.filter((t) => t.stage === s.n);
    const done = inStage.filter((t) => earned.has(t.id)).length;
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = 'Stage ' + s.n;
    const title = document.createElement('strong');
    title.textContent = s.title;
    const text = document.createElement('p');
    text.textContent = s.text;
    const count = document.createElement('p');
    const countSpan = document.createElement('span');
    countSpan.className = 'stage-count';
    countSpan.textContent = done + '/' + inStage.length + ' earned';
    count.append(countSpan);
    li.append(num, title, text, count);
    list.append(li);
  }
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = Math.round((done / total) * 100);
  document.getElementById('progressBig').textContent = done + ' / ' + total;
  document.getElementById('progressLabel').textContent = 'trophies earned — ' + pct + '%';
  const bar = document.getElementById('progressBar');
  bar.setAttribute('aria-valuenow', String(done));
  document.getElementById('progressFill').style.width = pct + '%';
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    return g[0].toUpperCase() + g.slice(1) + ' ' + got + '/' + all;
  });
  document.getElementById('gradeCounts').textContent = counts.join(' · ');
}

function renderList() {
  const list = visibleTrophies();
  rowsEl.replaceChildren();
  document.getElementById('emptyNote').hidden = list.length > 0;
  document.getElementById('resultCount').textContent =
    kind === 'online'
      ? 'Showing 0 of 55 — the official PlayStation list has no online trophies.'
      : 'Showing ' + list.length + ' of ' + trophies.length + ' trophies.';
  for (const t of list) {
    const li = document.createElement('li');
    if (earned.has(t.id)) li.classList.add('earned');
    if (t.id === selectedId) li.classList.add('selected');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveEarned();
      renderAll();
    });
    box.addEventListener('click', (e) => e.stopPropagation());
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    if (isSpoilerHidden(t)) {
      const mask = document.createElement('span');
      mask.className = 'spoiler-mask';
      mask.textContent = 'Hidden story trophy — earn it to reveal';
      name.append(mask);
    } else {
      name.textContent = t.name;
    }
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = isSpoilerHidden(t) ? 'Hidden until earned (spoiler-safe mode is on).' : t.description;
    body.append(name, desc, tagList(t));
    li.append(box, body, gradeBadge(t));
    li.addEventListener('click', () => {
      selectedId = t.id;
      renderList();
      renderDetail();
    });
    rowsEl.append(li);
  }
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  detailEl.replaceChildren();
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Select a trophy from the checklist to see its guide and sources.';
    detailEl.append(p);
    return;
  }
  const title = document.createElement('h3');
  if (isSpoilerHidden(t)) {
    title.textContent = 'Hidden story trophy';
  } else {
    title.textContent = t.name;
  }
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = isSpoilerHidden(t)
    ? 'Official name and description hidden until earned.'
    : 'Official: "' + t.description + '" — ' + t.grade + ' trophy.';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = isSpoilerHidden(t)
    ? 'Turn off spoiler-safe mode, or tick this trophy earned, to read its guide.'
    : t.guide;
  detailEl.append(title, official, tagList(t), guide);
  if (!isSpoilerHidden(t)) {
    const sources = document.createElement('div');
    sources.className = 'sources';
    const strong = document.createElement('strong');
    strong.textContent = 'Sources';
    const ul = document.createElement('ul');
    for (const s of t.sources) {
      const li = document.createElement('li');
      li.textContent = s;
      ul.append(li);
    }
    sources.append(strong, ul);
    detailEl.append(sources);
  }
  const line = document.createElement('p');
  line.className = 'earned-line';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.id = 'detailEarned';
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    saveEarned();
    renderAll();
  });
  const label = document.createElement('label');
  label.setAttribute('for', 'detailEarned');
  label.textContent = ' Earned';
  line.append(box, label);
  detailEl.append(line);
}

function renderAll() {
  renderRoadmap();
  renderProgress();
  renderList();
  renderDetail();
}

function wireControls() {
  const search = document.getElementById('search');
  search.value = query;
  search.addEventListener('input', () => {
    query = search.value;
    renderList();
  });
  document.getElementById('kindChips').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-kind]');
    if (!btn) return;
    kind = btn.dataset.kind;
    for (const b of document.querySelectorAll('#kindChips .chip')) {
      b.classList.toggle('active', b === btn);
    }
    renderList();
  });
  for (const b of document.querySelectorAll('#kindChips .chip')) {
    b.classList.toggle('active', b.dataset.kind === kind);
  }
  const gradeSel = document.getElementById('grade');
  gradeSel.value = grade;
  gradeSel.addEventListener('change', () => {
    grade = gradeSel.value;
    renderList();
  });
  const spoilerBox = document.getElementById('spoiler');
  spoilerBox.checked = spoiler;
  spoilerBox.addEventListener('change', () => {
    spoiler = spoilerBox.checked;
    renderAll();
  });
  document.getElementById('earnedOnly').addEventListener('change', (e) => {
    earnedOnly = e.target.checked;
    renderList();
  });
  document.getElementById('export').addEventListener('click', () => {
    const payload = { game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b), exported: new Date().toISOString() };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const ids = Array.isArray(data) ? data : data.earned;
      const next = new Set();
      for (const id of ids ?? []) {
        if (trophies.some((t) => t.id === id)) next.add(id);
      }
      earned = next;
      saveEarned();
      renderAll();
    } catch {
      alert('That file is not a Leonida Legend progress export.');
    }
    e.target.value = '';
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Clear all earned trophies?')) {
      earned = new Set();
      saveEarned();
      renderAll();
    }
  });
}

wireControls();
renderAll();
