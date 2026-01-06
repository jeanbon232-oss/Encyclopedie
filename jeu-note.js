import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =========================
   Supabase (copié de app.js)
========================= */
const SUPABASE_URL = "https://wjanwfxbtgvxjgohlliu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYW53ZnhidGd2eGpnb2hsbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzM0MTIsImV4cCI6MjA4MjkwOTQxMn0.3GHwxMSKd1RYagskXzU6QyyVxoJJsfxZV5QeOVmweBk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MAX_ROUNDS = 10;

let beers = [];
let currentPair = [];
let currentRound = 1;
let score = 0;
let hasAnswered = false;
let CURRENT_USER = null;

/* =========================
   DOM
========================= */
const roundSpan = document.getElementById("ng-round");
const scoreSpan = document.getElementById("ng-score");
const feedbackP = document.getElementById("ng-feedback");
const nextBtn = document.getElementById("ng-next");
const endSection = document.getElementById("ng-end");
const finalScoreP = document.getElementById("ng-final-score");

const saveForm = document.getElementById("ng-save-form");
const nameInput = document.getElementById("ng-name");

// Ajoutés dans ton HTML (si absents, le code reste safe)
const authHint = document.getElementById("ng-auth-hint");
const saveMsg = document.getElementById("ng-save-msg");
const leaderboardHint = document.getElementById("ng-leaderboard-hint");

const leaderboardSection = document.getElementById("ng-leaderboard");
const leaderboardList = document.getElementById("ng-leaderboard-list");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const cards = Array.from(document.querySelectorAll(".note-card"));

/* =========================
   Helpers
========================= */
function setSaveMsg(txt, isError = false) {
  if (!saveMsg) return;
  saveMsg.textContent = txt || "";
  saveMsg.style.color = isError ? "#b00000" : "";
}

function sanitizeUsername(v) {
  return String(v ?? "").trim().slice(0, 20);
}

/* =========================
   Auth UI (login/logout)
========================= */
function applyAuthUI(user) {
  if (loginBtn) loginBtn.hidden = !!user;
  if (logoutBtn) logoutBtn.hidden = !user;

  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      window.location.reload();
    };
  }
}

async function initAuth() {
  const { data, error } = await supabase.auth.getSession();
  CURRENT_USER = error ? null : (data?.session?.user ?? null);
  applyAuthUI(CURRENT_USER);

  supabase.auth.onAuthStateChange((_event, session) => {
    CURRENT_USER = session?.user ?? null;
    applyAuthUI(CURRENT_USER);
  });
}

/* =========================
   Profiles (pseudo)
========================= */
async function getMyUsername(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data?.username ?? null;
}

async function upsertMyUsername(userId, username) {
  const u = sanitizeUsername(username);
  if (!u) return { error: { message: "Pseudo vide." } };

  // Upsert : nécessite UPDATE own et (si row absente) INSERT own sur profiles
  return await supabase
    .from("profiles")
    .upsert({ id: userId, username: u }, { onConflict: "id" });
}

/* =========================
   Leaderboard (Supabase)
========================= */
async function loadLeaderboardGlobal() {
  // 1) scores
  const { data: scores, error: sErr } = await supabase
    .from("note_game_scores")
    .select("user_id, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (sErr) {
    console.error("note_game_scores select error:", sErr);
    return [];
  }

  const rows = scores ?? [];
  const ids = [...new Set(rows.map(r => r.user_id).filter(Boolean))];

  // 2) usernames
  let profileMap = new Map();
  if (ids.length) {
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", ids);

    if (pErr) {
      console.error("profiles select error:", pErr);
    } else {
      (profiles ?? []).forEach(p => profileMap.set(p.id, p.username));
    }
  }

  return rows.map(r => ({
    username: profileMap.get(r.user_id) || "Anonyme",
    score: r.score,
    created_at: r.created_at
  }));
}

function renderLeaderboard(entries) {
  if (!leaderboardList || !leaderboardSection) return;

  leaderboardList.innerHTML = "";
  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${entry.username} — ${entry.score}/${MAX_ROUNDS}`;
    leaderboardList.appendChild(li);
  });

  leaderboardSection.hidden = entries.length === 0;

  // Si tu as laissé un texte "local" dans le HTML, on le corrige
  if (leaderboardHint) {
    leaderboardHint.textContent = "Classement global (tous utilisateurs).";
  }
}

async function refreshLeaderboardGlobal() {
  const entries = await loadLeaderboardGlobal();
  renderLeaderboard(entries);
}

/* =========================
   Endgame UI (connecté / pas connecté)
========================= */
async function initEndgameAuthUI() {
  setSaveMsg("");

  if (!saveForm) return;

  if (!CURRENT_USER) {
    saveForm.hidden = true;
    if (authHint) authHint.hidden = false;
    return;
  }

  if (authHint) authHint.hidden = true;
  saveForm.hidden = false;

  const existing = await getMyUsername(CURRENT_USER.id);
  if (existing && nameInput) nameInput.value = existing;
}

/* =========================
   Game logic (inchangé)
========================= */
async function loadBeers() {
  try {
    const res = await fetch("beers.json");
    beers = await res.json();
    beers = beers.filter(b => typeof b.rating === "number");
    startGame();
  } catch (e) {
    feedbackP.textContent = "Impossible de charger les bières.";
    console.error(e);
  }
}

function startGame() {
  currentRound = 1;
  score = 0;
  updateStatus();
  showNewPair();
  // leaderboard global dès le début (optionnel, mais utile)
  refreshLeaderboardGlobal();
}

function updateStatus() {
  roundSpan.textContent = `Manche ${currentRound}/${MAX_ROUNDS}`;
  scoreSpan.textContent = `Score : ${score}`;
}

function pickRandomPair() {
  if (beers.length < 2) return null;
  let i = Math.floor(Math.random() * beers.length);
  let j;
  do {
    j = Math.floor(Math.random() * beers.length);
  } while (j === i);
  return [beers[i], beers[j]];
}

function renderPair(pair) {
  currentPair = pair;
  hasAnswered = false;
  feedbackP.textContent = "";
  nextBtn.disabled = true;

  cards.forEach((card, idx) => {
    const beer = pair[idx];
    card.classList.remove("is-correct", "is-wrong");
    card.disabled = false;

    const nameEl = card.querySelector(".note-name");
    const styleEl = card.querySelector(".note-style");
    const ratingEl = card.querySelector(".note-rating");

    nameEl.textContent = beer.name;
    styleEl.textContent = beer.style || "";
    ratingEl.textContent = `Note : ${beer.rating.toFixed(2)}/20`;
    ratingEl.classList.add("hidden");
  });
}

function showNewPair() {
  const pair = pickRandomPair();
  if (!pair) {
    feedbackP.textContent = "Pas assez de bières pour jouer.";
    return;
  }
  renderPair(pair);
}

function handleChoice(idx) {
  if (hasAnswered) return;
  hasAnswered = true;

  const [beerA, beerB] = currentPair;
  const chosen = idx === 0 ? beerA : beerB;

  const correctBeer =
    beerA.rating === beerB.rating ? null : (beerA.rating > beerB.rating ? beerA : beerB);

  cards.forEach((_card, i) => {
    const card = cards[i];
    const ratingEl = card.querySelector(".note-rating");
    ratingEl.classList.remove("hidden");

    card.disabled = true;

    const beer = i === 0 ? beerA : beerB;
    if (correctBeer && beer.name === correctBeer.name) {
      card.classList.add("is-correct");
    }
  });

  if (!correctBeer) {
    feedbackP.textContent = `Égalité parfaite : ${beerA.rating.toFixed(2)} = ${beerB.rating.toFixed(2)}. Manche neutre.`;
  } else if (chosen.name === correctBeer.name) {
    score++;
    feedbackP.textContent = `Bonne réponse ! ${correctBeer.name} a la note la plus élevée (${correctBeer.rating.toFixed(2)}/20).`;
  } else {
    feedbackP.textContent = `Raté ! ${correctBeer.name} a la note la plus élevée (${correctBeer.rating.toFixed(2)}/20).`;
  }

  updateStatus();
  nextBtn.disabled = false;
}

function nextRound() {
  if (currentRound >= MAX_ROUNDS) {
    endGame();
    return;
  }
  currentRound++;
  updateStatus();
  showNewPair();
}

async function endGame() {
  finalScoreP.textContent = `Tu termines avec un score de ${score}/${MAX_ROUNDS}.`;
  endSection.hidden = false;

  await initEndgameAuthUI();
  await refreshLeaderboardGlobal();
}

/* =========================
   Save score (Supabase)
========================= */
async function saveScoreToSupabase() {
  if (!CURRENT_USER) return { error: { message: "Non connecté." } };

  const pseudo = sanitizeUsername(nameInput?.value);
  if (!pseudo) return { error: { message: "Pseudo requis." } };

  setSaveMsg("Enregistrement…");

  const { error: uErr } = await upsertMyUsername(CURRENT_USER.id, pseudo);
  if (uErr) return { error: uErr };

  const { error: sErr } = await supabase
    .from("note_game_scores")
    .insert({ user_id: CURRENT_USER.id, score });

  if (sErr) return { error: sErr };

  return { error: null };
}

/* =========================
   listeners
========================= */
cards.forEach((card, idx) => {
  card.addEventListener("click", () => handleChoice(idx));
});

nextBtn.addEventListener("click", () => {
  nextRound();
});

if (saveForm) {
  saveForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setSaveMsg("");

    const { error } = await saveScoreToSupabase();
    if (error) {
      console.error("save score error:", error);
      setSaveMsg(error.message || "Impossible d’enregistrer.", true);
      return;
    }

    setSaveMsg("Score enregistré.");
    saveForm.reset();
    await refreshLeaderboardGlobal();
  });
}

/* =========================
   go !
========================= */
await initAuth();
loadBeers();

