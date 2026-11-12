'use strict';
document.documentElement.classList.add('js');

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GLYPHS = 'アカサタナハマヤラワ0123456789ABCDEF<>/{}[]#$%&';
const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

// --- langues : le français vit dans le HTML, les autres dans lang/<code>.json ---
const typed = $('#typed');
const picker = $('#lang');
const meta = $('meta[name="description"]');
const FR = {
  title: document.title,
  desc: meta.content,
  boot: [
    '[  OK  ] Initialisation du noyau',
    '[  OK  ] Chargement des modules : nftables sshd jwt rls',
    '[  OK  ] Politique par défaut : DROP',
    '[  OK  ] Session chiffrée établie',
    '> ACCÈS AUTORISÉ',
  ],
  roles: [
    typed.textContent,
    'Durcissement réseau : nftables, SSH, DMZ',
    'Sécurité applicative : JWT, bcrypt, OAuth',
    'Moindre privilège : RLS, rôles, GRANT',
    'Backend : Python, Go, TypeScript',
  ],
  help: [
    'whoami       qui suis-je',
    'projets      liste des dossiers',
    'defense      les six couches',
    'competences  outils et savoir-faire',
    'parcours     formation',
    'contact      me joindre',
    'clear        vider l\'écran',
  ],
  who: ['Paul Bourdareau Launay', 'Bachelor 2 Informatique, Ynov Campus Paris Ouest', 'Cap : cybersécurité'],
  ls: 'whoami  defense/  projets/  competences/  parcours/  contact  flag.txt',
  sudo: 'visiteur n\'est pas dans le fichier sudoers. Cet incident sera signalé.',
  nf: 'commande introuvable : {0} (essayez help)',
};
for (const el of $$('[data-i18n]')) FR[el.dataset.i18n] = el.innerHTML;
for (const el of $$('[data-i18n-aria]')) FR[el.dataset.i18nAria] = el.getAttribute('aria-label');
const dicts = { fr: FR };
let lang = 'fr';
let T = FR;

async function load(code) {
  if (dicts[code]) return dicts[code];
  // en-GB ne liste que ses écarts avec en-US ; une clé oubliée retombe sur le français
  const base = code === 'en-GB' ? await load('en-US') : FR;
  const r = await fetch(`lang/${code}.json`);
  if (!r.ok) throw new Error(`lang/${code}.json : ${r.status}`);
  return (dicts[code] = { ...base, ...await r.json() });
}
async function setLang(code) {
  picker.value = code;
  try { await load(code); } catch { /* hors ligne : traité juste en dessous */ }
  if (picker.value !== code) return; // un autre choix est arrivé pendant le chargement
  if (!dicts[code]) { picker.value = lang; return; } // chargement raté : on garde la langue affichée
  lang = code;
  T = dicts[code];
  document.documentElement.lang = code;
  document.title = T.title;
  meta.content = T.desc;
  // innerHTML : ces chaînes viennent du dépôt, jamais du visiteur
  for (const el of $$('[data-i18n]')) el.innerHTML = T[el.dataset.i18n];
  for (const el of $$('[data-i18n-aria]')) el.setAttribute('aria-label', T[el.dataset.i18nAria]);
  typed.textContent = T.roles[0];
}
function preferred() {
  const codes = [...picker.options].map((o) => o.value);
  try {
    const saved = localStorage.getItem('lang');
    if (codes.includes(saved)) return saved;
  } catch { /* stockage bloqué : on suit la langue du navigateur */ }
  for (const l of navigator.languages || []) {
    const hit = codes.find((c) => c === l) || codes.find((c) => c.split('-')[0] === l.split('-')[0]);
    if (hit) return hit;
  }
  return 'fr';
}
picker.addEventListener('change', () => {
  try { localStorage.setItem('lang', picker.value); } catch { /* stockage bloqué : choix valable pour cette visite */ }
  setLang(picker.value);
});
const first = preferred();
if (first !== 'fr') await setLang(first); // avant l'écran de démarrage, pour qu'il sorte dans la bonne langue

// --- écran de démarrage, une fois par session ---
function sessionFlag(key) {
  try {
    if (sessionStorage.getItem(key)) return true;
    sessionStorage.setItem(key, '1');
  } catch { /* stockage bloqué : on rejoue simplement l'intro */ }
  return false;
}
if (!calm && !sessionFlag('boot')) {
  const boot = document.createElement('div');
  boot.id = 'boot';
  boot.setAttribute('aria-hidden', 'true');
  document.body.append(boot);
  const lines = T.boot;
  const close = () => { boot.classList.add('out'); setTimeout(() => boot.remove(), 450); };
  lines.forEach((l, i) => setTimeout(() => {
    const p = document.createElement('p');
    p.textContent = l;
    boot.append(p);
    if (i === lines.length - 1) setTimeout(close, 380);
  }, 170 * (i + 1)));
  boot.addEventListener('click', close);
}

// --- pluie de caractères ---
const canvas = $('#rain');
if (!calm && canvas) {
  const ctx = canvas.getContext('2d');
  const SIZE = 16;
  let drops = [];
  const resize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    drops = Array.from({ length: Math.ceil(innerWidth / SIZE) }, () => Math.random() * -50);
  };
  resize();
  addEventListener('resize', resize);
  let last = 0;
  const draw = (t) => {
    requestAnimationFrame(draw); // le navigateur suspend déjà rAF quand l'onglet est caché
    if (t - last < 60) return;
    last = t;
    ctx.fillStyle = 'rgba(5, 8, 10, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = SIZE + 'px monospace';
    drops.forEach((y, i) => {
      ctx.fillStyle = Math.random() > 0.975 ? '#d8fff0' : '#3dffa2';
      ctx.fillText(glyph(), i * SIZE, y * SIZE);
      drops[i] = y * SIZE > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
    });
  };
  requestAnimationFrame(draw);
}

// --- rôle tapé en boucle ---
if (!calm) {
  let roles, r, n, dir, wait;
  setInterval(() => {
    // premier passage ou langue changée : on repart du rôle complet
    if (roles !== T.roles) { roles = T.roles; r = 0; n = roles[0].length; dir = -1; wait = 40; }
    if (wait > 0) { wait--; return; }
    n += dir;
    typed.textContent = roles[r].slice(0, n);
    if (n === 0) { r = (r + 1) % roles.length; dir = 1; }
    else if (n === roles[r].length) { dir = -1; wait = 40; }
  }, 45);
}

// --- apparition au défilement + titres « déchiffrés » ---
function scramble(el) {
  const text = el.textContent;
  const at = lang;
  let i = 0;
  const id = setInterval(() => {
    if (lang !== at) return clearInterval(id); // langue changée en cours d'effet : le nouveau texte est déjà en place
    el.textContent = [...text].map((ch, j) => (j < i || ch === ' ' ? ch : glyph())).join('');
    if (i++ >= text.length) clearInterval(id);
  }, 32);
}
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    seen.unobserve(e.target);
    if (e.target.classList.contains('scramble')) { if (!calm) scramble(e.target); }
    else e.target.classList.add('on');
  }
}, { threshold: 0.12 });
$$('.reveal, .scramble').forEach((el) => seen.observe(el));

// --- barre de progression + horloge ---
const bar = $('#progress');
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
}, { passive: true });
const clock = $('#clock');
const tick = () => { clock.textContent = new Date().toLocaleTimeString(lang); };
tick();
setInterval(tick, 1000);

// --- terminal ---
const out = $('#term-out');
const input = $('#term-in');
const body = $('.term-body');
const print = (text, cls) => {
  const p = document.createElement('p');
  if (cls) p.className = cls;
  p.textContent = text; // textContent : la saisie du visiteur n'est jamais interprétée comme HTML
  out.append(p);
};
const go = (id) => () => { $(id).scrollIntoView(); return ['→ ' + id]; };
const commands = {
  help: () => T.help,
  whoami: () => T.who,
  projets: () => $$('.card h3').map((h, i) => `0${i + 1}  ${h.textContent}`),
  ls: () => [T.ls],
  defense: go('#defense'),
  competences: go('#competences'),
  parcours: go('#parcours'),
  contact: () => [
    'Mail     : contact@paulbl.com',
    'LinkedIn : https://www.linkedin.com/in/paul-bourdareau-launay-335a013a3/',
    'GitHub   : https://github.com/PaulEnBon',
  ],
  sudo: () => [T.sudo],
  'cat flag.txt': () => ['PBL{l3_m01ndr3_pr1v1l3g3}'],
};
// les noms anglais et français marchent dans toutes les langues
commands.skills = commands['compétences'] = commands.competences;
commands.projects = commands.projets;
commands.education = commands.parcours;
commands.defence = commands['défense'] = commands.defense;

$('#term-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = input.value.trim();
  input.value = '';
  if (!raw) return;
  print(T.prompt + ' ' + raw, 'in');
  const cmd = raw.toLowerCase();
  const run = Object.hasOwn(commands, cmd) ? commands[cmd] : cmd.startsWith('sudo ') ? commands.sudo : null;
  if (cmd === 'clear') out.replaceChildren();
  else if (run) run().forEach((l) => print(l, 'hl'));
  else print(T.nf.replace('{0}', () => raw), 'err'); // fonction : un « $& » tapé par le visiteur reste du texte
  body.scrollTop = body.scrollHeight;
});
body.addEventListener('click', () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });
