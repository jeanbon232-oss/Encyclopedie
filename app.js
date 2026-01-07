import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =========================
   Supabase
========================= */
const SUPABASE_URL = "https://wjanwfxbtgvxjgohlliu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYW53ZnhidGd2eGpnb2hsbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzM0MTIsImV4cCI6MjA4MjkwOTQxMn0.3GHwxMSKd1RYagskXzU6QyyVxoJJsfxZV5QeOVmweBk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =========================
   State
========================= */
let CURRENT_USER = null;
let CURRENT_BEER_ID = null;
let ALL_BEERS = [];
let LAST_SHOWN = [];

/* =========================
   Auth UI + Change username
========================= */
function cleanUsername(raw) {
  const u = String(raw ?? "").trim();
  if (u.length < 3) return null;
  if (u.length > 20) return null;
  if (!/^[a-zA-Z0-9._\- ]+$/.test(u)) return null;
  return u;
}

async function upsertProfileUsername(userId, username) {
  return await supabase
    .from("profiles")
    .upsert({ id: userId, username }, { onConflict: "id" });
}

async function handleChangeUsername(user) {
  const input = window.prompt("Nouveau pseudo (3–20 caractères) :");
  if (input === null) return; // annulé

  const username = cleanUsername(input);
  if (!username) {
    window.alert("Pseudo invalide (3–20 caractères, lettres/chiffres/._- et espaces).");
    return;
  }

  const { error } = await upsertProfileUsername(user.id, username);
  if (error) {
    console.error("upsertProfileUsername error:", error);
    window.alert("Impossible de changer le pseudo (RLS / droits ?).");
    return;
  }

  window.alert("Pseudo mis à jour.");
}

function applyAuthUI(user) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const changeUsernameBtn = document.getElementById("changeUsernameBtn");

  const isLoggedIn = !!user;

  if (loginBtn) loginBtn.hidden = isLoggedIn;
  if (logoutBtn) logoutBtn.hidden = !isLoggedIn;
  if (changeUsernameBtn) changeUsernameBtn.hidden = !isLoggedIn;

  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault?.();
      await supabase.auth.signOut();
      window.location.reload();
    };
  }

  if (changeUsernameBtn) {
    changeUsernameBtn.onclick = async (e) => {
      e.preventDefault?.();
      if (!CURRENT_USER) return;
      await handleChangeUsername(CURRENT_USER);
    };
  }
}

async function setupAuthUI() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("getSession error:", error);
    CURRENT_USER = null;
    applyAuthUI(null);
    return null;
  }

  CURRENT_USER = data?.session?.user ?? null;
  applyAuthUI(CURRENT_USER);
  return CURRENT_USER;
}

// Sync auth state in real time
supabase.auth.onAuthStateChange((_event, session) => {
  CURRENT_USER = session?.user ?? null;
  applyAuthUI(CURRENT_USER);

  // Si la modale est ouverte, on rafraîchit l'état du formulaire commentaire
  const modal = document.getElementById("beer-modal");
  if (modal && !modal.hidden && CURRENT_BEER_ID) {
    setupCommentUIForBeer(CURRENT_BEER_ID);
  }
});

/* =========================
   Beers list
========================= */
async function loadBeers() {
  const res = await fetch("beers.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Impossible de charger beers.json");
  return res.json();
}

function toNumRating(v) {
  if (v == null) return NaN;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function render(beers, { q = "", sort = "name-asc" } = {}) {
  const list = document.getElementById("list");
  const tpl = document.getElementById("beer-card");
  if (!list || !tpl) return [];

  const query = q.trim().toLowerCase();
  let items = beers.filter((b) => {
    const hay = `${b.name} ${b.style ?? ""} ${b.notes ?? ""}`.toLowerCase();
    return hay.includes(query);
  });

  const [key, dir] = sort.split("-");
  const mul = dir === "desc" ? -1 : 1;

  items.sort((a, b) => {
    if (key === "name") {
      const va = a.name.toLowerCase();
      const vb = b.name.toLowerCase();
      return va > vb ? +1 * mul : va < vb ? -1 * mul : 0;
    }
    if (key === "rating") {
      const va = toNumRating(a.rating);
      const vb = toNumRating(b.rating);
      const aNum = Number.isFinite(va);
      const bNum = Number.isFinite(vb);

      // Non-numériques toujours en bas (quel que soit le sens)
      if (aNum && bNum) return (va - vb) * mul;
      if (aNum && !bNum) return -1;
      if (!aNum && bNum) return +1;
      return 0;
    }
    return 0;
  });

  list.innerHTML = "";

  for (const b of items) {
    const node = tpl.content.cloneNode(true);

    // Clé stable pour retrouver la carte
    const articleEl = node.querySelector("article") || node.firstElementChild;
    if (articleEl) articleEl.dataset.key = `${b.name}|${b.rating ?? ""}`;

    // Champs
    const nameEl = node.querySelector(".beer-name");
    const ratingEl = node.querySelector(".beer-rating");
    const styleEl = node.querySelector(".beer-style");
    const notesEl = node.querySelector(".beer-notes");
    const yearEl = node.querySelector(".beer-year");

    if (nameEl) {
      nameEl.textContent = b.name;
      nameEl.style.cursor = "pointer";
      nameEl.addEventListener("click", () => openBeerModal(b));
    }

    // Note
    let ratingText = "—";
    if (b.rating != null) ratingText = `${b.rating}/20`;

    if (ratingEl) {
      if (b.rating != null) {
        const r = parseFloat(String(b.rating).replace(",", "."));
        if (!Number.isNaN(r)) {
          let color;
          if (r < 6) color = "#b00000";
          else if (r < 8) color = "#d04000";
          else if (r < 10) color = "#e07000";
          else if (r < 12) color = "#e8a600";
          else if (r < 14) color = "#b5c700";
          else if (r < 16) color = "#6bb300";
          else color = "#118000";
          ratingEl.style.color = color;
        } else {
          // Cas texte ("larcin et revente", etc.)
          ratingEl.style.color = "#800080";
          ratingEl.style.fontWeight = "700";
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
        const wrapper = ratingEl.querySelector(".coeur-wrapper");
        const tooltip = ratingEl.querySelector(".coeur-tooltip");
        if (wrapper && tooltip) {
          wrapper.style.cursor = "pointer";
          wrapper.addEventListener("click", () => {
            tooltip.hidden = !tooltip.hidden;
          });
        }
      } else {
        ratingEl.textContent = ratingText;
      }
    }

    if (styleEl) styleEl.textContent = b.style ?? "—";
    if (notesEl) notesEl.textContent = b.notes ?? "";
    if (yearEl) yearEl.textContent = b.year ? `Année: ${b.year}` : "";

    list.appendChild(node);
  }

  if (items.length === 0) {
    list.innerHTML = `<p style="opacity:.7">Aucun résultat.</p>`;
  }

  return items;
}

/* =========================
   Random + filters
========================= */
function setupListControls() {
  const search = document.getElementById("search");
  const sort = document.getElementById("sort");
  const randomBtn = document.getElementById("randomBtn");

  if (!search || !sort) return;

  const refresh = () => {
    LAST_SHOWN = render(ALL_BEERS, { q: search.value, sort: sort.value });
  };

  search.addEventListener("input", refresh);
  sort.addEventListener("change", refresh);

  if (randomBtn) {
    randomBtn.addEventListener("click", (ev) => {
      const pool = ev.shiftKey ? ALL_BEERS : LAST_SHOWN;
      if (!pool || pool.length === 0) return;

      const pick = pool[Math.floor(Math.random() * pool.length)];
      const key = `${pick.name}|${pick.rating ?? ""}`;
      const target = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
      if (!target) return;

      document.querySelectorAll(".card.flash").forEach((el) => el.classList.remove("flash"));
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      void target.offsetWidth;
      target.classList.add("flash");
    });
  }

  refresh();
}

/* =========================
   Comments (modal)
========================= */
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("fr-BE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadComments(beerId) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, profiles(username)")
    .eq("beer_id", beerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadComments error:", error);
    return [];
  }
  return data ?? [];
}

function setCommentMsg(text, isError = false) {
  const el = document.getElementById("commentMsg");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "#b00000" : "";
}

async function renderComments(beerId) {
  const listEl = document.getElementById("commentsList");
  if (!listEl) return;

  listEl.innerHTML = `<div style="opacity:.7;">Chargement…</div>`;
  const comments = await loadComments(beerId);

  if (!comments.length) {
    listEl.innerHTML = `<div style="opacity:.7;">Aucun commentaire pour le moment.</div>`;
    return;
  }

  listEl.innerHTML = "";
  for (const c of comments) {
    const item = document.createElement("div");
    item.className = "comments__item";

    const author = c.profiles?.username ?? "Anonyme";

    item.innerHTML = `
      <div><strong>${escapeHtml(author)}</strong></div>
      <div>${escapeHtml(c.content)}</div>
      <div class="comments__meta">${formatDate(c.created_at)}</div>
    `;
    listEl.appendChild(item);
  }
}

async function postComment(beerId, content) {
  const { error } = await supabase.from("comments").insert({
    beer_id: beerId,
    content,
  });
  return error;
}

function setupCommentUIForBeer(beerId) {
  const form = document.getElementById("commentForm");
  const hint = document.getElementById("commentAuthHint");
  const textarea = document.getElementById("commentContent");

  if (!form || !hint) return;

  const isLoggedIn = !!CURRENT_USER;
  form.hidden = !isLoggedIn;
  hint.hidden = isLoggedIn;

  setCommentMsg("");
  if (textarea) textarea.value = "";

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!CURRENT_USER) return;

    const content = (textarea?.value ?? "").trim();
    if (!content) return;

    setCommentMsg("Publication…");
    const err = await postComment(beerId, content);

    if (err) {
      console.error("postComment error:", err);
      setCommentMsg("Impossible de publier (es-tu bien connecté ?).", true);
      return;
    }

    if (textarea) textarea.value = "";
    setCommentMsg("Publié.");
    await renderComments(beerId);
  };
}

/* =========================
   Beer modal
========================= */
function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getBeerImageUrl(beerName) {
  const slug = slugify(beerName);
  return `img/beers/${slug}.jpg`;
}

function getFallbackImageUrl() {
  return `img/beers/placeholder2.png`;
}

function cleanBeerNameForSearch(name) {
  if (!name) return "";
  return name.replace(/\s*\((?=[^)]*\d)[^)]*\)\s*$/, "").trim();
}

function getBeerLink(beer) {
  const rawName = beer.name || "";
  const cleanName = cleanBeerNameForSearch(rawName);
  const nameForSearch = cleanName || rawName;

  if (beer.source && /^https?:\/\//i.test(beer.source)) return beer.source;

  const q = encodeURIComponent(`${nameForSearch} bière`);
  return `https://www.google.com/search?q=${q}`;
}

function openBeerModal(beer) {
  const modal = document.getElementById("beer-modal");
  if (!modal) return;

  const imgEl = document.getElementById("beer-img");
  const tEl = document.getElementById("beer-title");
  const sEl = document.getElementById("beer-style");
  const rEl = document.getElementById("beer-rating");
  const nEl = document.getElementById("beer-notes");
  const lEl = document.getElementById("beer-link");

  const name = beer.name || "Bière";

  if (tEl) tEl.textContent = name;
  if (sEl) sEl.textContent = beer.style ? `Style : ${beer.style}` : "";
  if (rEl) rEl.textContent = beer.rating ? `Note : ${beer.rating}/20` : "";
  if (nEl) nEl.textContent = beer.notes || "";

  if (imgEl) {
    imgEl.src = getBeerImageUrl(name);
    imgEl.alt = `Bouteille — ${name}`;
    imgEl.onerror = () => {
      imgEl.src = getFallbackImageUrl();
    };
  }

  if (lEl) lEl.href = getBeerLink(beer);

  modal.hidden = false;
  document.body.classList.add("modal-open");

  const beerId = (beer.name || "unknown").trim();
  CURRENT_BEER_ID = beerId;

  renderComments(beerId);
  setupCommentUIForBeer(beerId);

  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    CURRENT_BEER_ID = null;
    document.removeEventListener("keydown", onEsc);
  }

  function onEsc(e) {
    if (e.key === "Escape") closeModal();
  }

  const closeBtn = modal.querySelector(".modal__close");
  const backdrop = modal.querySelector(".modal__backdrop");

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    };
  }

  if (backdrop) backdrop.onclick = closeModal;

  document.addEventListener("keydown", onEsc);
}

/* =========================
   Main
========================= */
(async function main() {
  try {
    await setupAuthUI();

    ALL_BEERS = await loadBeers();
    setupListControls();
  } catch (err) {
    console.error("FATAL:", err);
    const list = document.getElementById("list");
    if (list) {
      list.innerHTML = `<p style="color:#b00000;opacity:.9">
        Erreur JS: ${String(err?.message || err)}
      </p>`;
    }
  }
})();







