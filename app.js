// Charge le JSON
async function loadBeers() {
  const res = await fetch('beers.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Impossible de charger beers.json');
  return res.json();
}

// Rendu + retour de la liste affichée
function render(beers, { q = '', sort = 'name-asc' } = {}) {
  const list = document.getElementById('list');
  const tpl = document.getElementById('beer-card');

  // filtre (recherche texte)
  const query = q.trim().toLowerCase();
  let items = beers.filter(b => {
    const hay = `${b.name} ${b.style ?? ''} ${b.notes ?? ''}`.toLowerCase();
    return hay.includes(query);
  });

  // tri
  const [key, dir] = sort.split('-'); // ex: "rating-desc"
  const mul = dir === 'desc' ? -1 : 1;

  function toNumRating(v) {
    if (v == null) return NaN;
    const n = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : NaN; // NaN si "larcin et revente"
  }

  items.sort((a, b) => {
    if (key === 'name') {
      const va = a.name.toLowerCase();
      const vb = b.name.toLowerCase();
      return va > vb ? +1 * mul : va < vb ? -1 * mul : 0;
    }
    if (key === 'year') {
      const va = a.year ?? -Infinity;
      const vb = b.year ?? -Infinity;
      return va > vb ? +1 * mul : va < vb ? -1 * mul : 0;
    }
    if (key === 'rating') {
      const va = toNumRating(a.rating);
      const vb = toNumRating(b.rating);
      const aNum = Number.isFinite(va);
      const bNum = Number.isFinite(vb);

      // Règle: les non-numériques vont toujours en bas (quel que soit le sens)
      if (aNum && bNum) return (va - vb) * mul;
      if (aNum && !bNum) return -1;
      if (!aNum && bNum) return +1;
      return 0;
    }
    return 0;
  });

  // rendu
  list.innerHTML = '';
  for (const b of items) {
    const node = tpl.content.cloneNode(true);

    // Clé stable pour retrouver la carte (random, scroll, etc.)
    const articleEl = node.querySelector('article') || node.firstElementChild;
    articleEl.dataset.key = `${b.name}|${b.rating ?? ''}`;

    // Champs
    node.querySelector('.beer-name').textContent = b.name;

    const ratingEl = node.querySelector('.beer-rating');
    ratingEl.textContent = b.rating != null ? `${b.rating}/20` : '—';

    // Couleur dynamique de la note (gère texte)
    if (b.rating != null) {
      const r = parseFloat(String(b.rating).replace(',', '.'));
      if (!Number.isNaN(r)) {
        let color;
        if (r < 6) color = '#b00000';         // rouge foncé
        else if (r < 8) color = '#d04000';    // orange foncé
        else if (r < 10) color = '#e07000';   // orange clair
        else if (r < 12) color = '#e8a600';   // jaune
        else if (r < 14) color = '#b5c700';   // vert très clair
        else if (r < 16) color = '#6bb300';   // vert pomme
        else color = '#118000';               // vert foncé
        ratingEl.style.color = color;
      } else {
        // Cas "gag" (texte)
        ratingEl.textContent = `${b.rating}/20`;
        ratingEl.style.color = '#800080';     // violet
        ratingEl.style.fontWeight = '700';
      }
    }

    node.querySelector('.beer-style').textContent = b.style ?? '—';
    node.querySelector('.beer-notes').textContent = b.notes ?? '';
    node.querySelector('.beer-year').textContent = b.year ? `Année: ${b.year}` : '';

    list.appendChild(node);
  }

  if (items.length === 0) {
    list.innerHTML = `<p style="opacity:.7">Aucun résultat.</p>`;
  }

  // IMPORTANT: retourne la liste affichée
  return items;
}

(async function main() {
  const beers = await loadBeers();

  const search = document.getElementById('search');
  const sort = document.getElementById('sort');
  const randomBtn = document.getElementById('randomBtn');

  let lastShown = [];

  function refresh() {
    lastShown = render(beers, { q: search.value, sort: sort.value });
  }

  // Filtres/tri
  search.addEventListener('input', refresh);
  sort.addEventListener('change', refresh);

  // Bouton Au hasard 🎲
  if (randomBtn) {
    randomBtn.addEventListener('click', (ev) => {
      const pool = ev.shiftKey ? beers : lastShown; // Shift = ignorer filtre
      if (!pool || pool.length === 0) return;

      const pick = pool[Math.floor(Math.random() * pool.length)];
      const key = `${pick.name}|${pick.rating ?? ''}`;

      const target = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
      if (!target) return;

      // nettoie un ancien flash
      document.querySelectorAll('.card.flash').forEach(el => el.classList.remove('flash'));

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // redémarre l'anim
      void target.offsetWidth;
      target.classList.add('flash');
    });
  }

  // Premier rendu
  refresh();
})();
