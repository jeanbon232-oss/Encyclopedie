import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://wjanwfxbtgvxjgohlliu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYW53ZnhidGd2eGpnb2hsbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzM0MTIsImV4cCI6MjA4MjkwOTQxMn0.3GHwxMSKd1RYagskXzU6QyyVxoJJsfxZV5QeOVmweBk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

supabase.auth.onAuthStateChange(() => {
  setupAuthUI();
});

async function setupAuthUI() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user ?? null;

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (user) {
    if (loginBtn) loginBtn.hidden = true;
    if (logoutBtn) {
      logoutBtn.hidden = false;
      logoutBtn.onclick = async () => {
        await supabase.auth.signOut();
        window.location.reload();
      };
    }
  } else {
    if (loginBtn) loginBtn.hidden = false;
    if (logoutBtn) logoutBtn.hidden = true;
  }

  return user;
}



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

    // 👇 ajoute ces 3 lignes ici
    const nameEl = node.querySelector('.beer-name');
    nameEl.style.cursor = "pointer";
    nameEl.addEventListener("click", () => openBeerModal(b));

     const ratingEl = node.querySelector('.beer-rating');

    // texte de base de la note
    let ratingText = '—';
    if (b.rating != null) {
      ratingText = `${b.rating}/20`;
    }

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
        ratingText = `${b.rating}/20`;
        ratingEl.style.color = '#800080';     // violet
        ratingEl.style.fontWeight = '700';
      }
    }

    if (b.coupDeCoeur) {
  ratingEl.innerHTML = `
    ${ratingText}
    <span class="coeur-wrapper">
      <img
        src="img/coup-de-coeur.png"
        alt="Coup de cœur des experts"
        class="badge-coeur"
      >
      <span class="coeur-tooltip" hidden>Coup de cœur des experts</span>
    </span>
  `;

  // rendre le rubis cliquable pour afficher/masquer le texte
  const wrapper = ratingEl.querySelector('.coeur-wrapper');
  const tooltip = ratingEl.querySelector('.coeur-tooltip');

  wrapper.style.cursor = "pointer";
  wrapper.addEventListener("click", () => {
    tooltip.hidden = !tooltip.hidden;
  });

} else {
  ratingEl.textContent = ratingText;
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
  const user = await setupAuthUI();
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

/* === Fonctions pour la fiche bière (modal) === */

// transforme "Duvel Tripel Hop" -> "duvel-tripel-hop"
function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // supprime accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// URL de l'image (si absente => placeholder)
function getBeerImageUrl(beerName) {
  const slug = slugify(beerName);
  return `img/beers/${slug}.jpg`;      // adapte si tes images sont ailleurs
}

function getFallbackImageUrl() {
  return `img/beers/placeholder2.png`;
}

// Nettoie le nom pour la recherche (enlève la date entre parenthèses à la fin)
function cleanBeerNameForSearch(name) {
  if (!name) return "";
  // supprime un bloc " (…)" en fin de chaîne UNIQUEMENT s'il contient un chiffre
  // ex: "Duvel (+4/2018)" -> "Duvel"
  //     "Orval (St Monon)" -> garde tout
  return name.replace(/\s*\((?=[^)]*\d)[^)]*\)\s*$/, "").trim();
}

// lien externe : si beer.source existe -> l’utilise, sinon une recherche Google
function getBeerLink(beer) {
  const rawName = beer.name || "";
  const cleanName = cleanBeerNameForSearch(rawName);
  const nameForSearch = cleanName || rawName; // fallback au cas où

  if (beer.source && /^https?:\/\//i.test(beer.source)) return beer.source;

  const q = encodeURIComponent(`${nameForSearch} bière`);
  return `https://www.google.com/search?q=${q}`;
}

// ouvre la modale et peuple le contenu
function openBeerModal(beer) {
  const modal = document.getElementById("beer-modal");
  const imgEl = document.getElementById("beer-img");
  const tEl = document.getElementById("beer-title");
  const sEl = document.getElementById("beer-style");
  const rEl = document.getElementById("beer-rating");
  const nEl = document.getElementById("beer-notes");
  const lEl = document.getElementById("beer-link");

  const name = beer.name || "Bière";
  tEl.textContent = name;
  sEl.textContent = beer.style ? `Style : ${beer.style}` : "";
  rEl.textContent = beer.rating ? `Note : ${beer.rating}/20` : "";
  nEl.textContent = beer.notes || "";

  imgEl.src = getBeerImageUrl(name);
  imgEl.alt = `Bouteille — ${name}`;
  imgEl.onerror = () => { imgEl.src = getFallbackImageUrl(); };

  lEl.href = getBeerLink(beer);

  modal.hidden = false;

  // fermeture
  modal.querySelector(".modal__close").onclick = () => modal.hidden = true;
  modal.querySelector(".modal__backdrop").onclick = () => modal.hidden = true;
  function onEsc(e) {
    if (e.key === "Escape") {
      modal.hidden = true;
      document.removeEventListener("keydown", onEsc);
    }
  }
  document.addEventListener("keydown", onEsc);
}







