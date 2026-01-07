import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* =========================
   Supabase
========================= */
const SUPABASE_URL = "https://wjanwfxbtgvxjgohlliu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYW53ZnhidGd2eGpnb2hsbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzM0MTIsImV4cCI6MjA4MjkwOTQxMn0.3GHwxMSKd1RYagskXzU6QyyVxoJJsfxZV5QeOVmweBk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MAX_ROUNDS = 10;

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

const saveMsg = document.getElementById("ng-save-msg");
const leaderboardHint = document.getElementById("ng-leaderboard-hint");

const leaderboardSection = document.getElementById("ng-leaderboard");
const leaderboardList = document.getElementById("ng-leaderboard-list");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const cards = Array.from(document.querySelectorAll(".note-card"));

// Container principal (pour afficher la carte "Connexion requise")
const mainContainer =
  document.getElementById("note-game-container") ||
  document.querySelector("main") ||
  document.body;

/* =========================
   State
========================= */
let beers = [];
let currentPair = [];
let currentRound = 1;
let score = 0;
let hasAnswered = false;

let CURRENT_USER = null;

/* =========================
   UI helpers
========================= */
function setSaveMsg(txt, isError = false) {
  if (!saveMsg) return;
  saveMsg.textContent = txt || "";
  saveMsg.style.color = isError ? "#b00000" : "";
}

function sanitizeUsername(v) {
  return String(v ?? "").trim().slice(0, 20);
}

function setAuthButtons(isLoggedIn) {
  if (loginBtn) loginBtn.hidden = isLoggedIn;
  if (logoutBtn) logoutBtn.hidden = !isLoggedIn;

  if (logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      await supabase.auth.signOut();
      // On revient sur la page (elle affichera "Connexion requise")
      window.location.href = "jeu-note.html";
    };
  }
}

function renderAuthRequired() {
  document.body.classList.add("needs-auth");

  if (!mainContainer) return;

  mainContainer.innerHTML = `
    <div class="card" style="padding:16px; border-radius:16px;">
      <h2 style="margin-top:0;">Connexion requise</h2>
      <p>Connecte-toi pour jouer au jeu de la note et enregistrer ton score.</p>
      <p style="margin:12px 0 0 0;">
        <a class="btn" href="auth.html?return=jeu-note.html">Se connecter</a>
      </p>
    </div>
  `;
}

/* =========================
   Auth gate (connexion obligatoire)
========================= */
async function requireAuthOrRender() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("getSession error:", error);

  const session = data?.session ?? null;
  setAuthButtons(!!session);

  if (!session) {
    renderAuthRequired();
    return null;
  }

  document.body.classList.remove("needs-auth");
  return session.user;
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

  return await supabase
    .from("profiles")
    .upsert({ id: userId, username: u }, { onConflict: "id" });
}

/* =========================
   Leaderboard (Supabase)
========================= */
async function loadLeaderboardGlobal() {
  const { data: scoresRows, error: sErr } = await supabase
    .from("note_game_scores")
    .select("user_id, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (sErr) {
    console.error("note_game_scores select error:", sErr);
    return [];
  }

  const rows = scoresRows ?? [];
  const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

  let profileMap = new Map();
  if (ids.length) {
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", ids);

    if (pErr) {
      console.error("profiles select error:", pErr);
    } else {
      (profiles ?? []).forEach((p) => profileMap.set(p.id, p.username));
    }
  }

  return rows.map((r) => ({
    username: profileMap.get(r.user_id) || "Anonyme",
    score: r.score,
    created_at: r.created_at,
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

  if (leaderboardHint) {
    leaderboardHint.textContent = "Classement global (tous utilisateurs).";
  }
}

async function refreshLeaderboardGlobal() {
  const entries = await loadLeaderboardGlobal();
  renderLeaderboard(entries);
}

/* =========================
   Game logic
========================= */
async function loadBeers() {
  try {
    const res = await fetch("beers.json");
    beers = await res.json();
    beers = beers.filter((b) => typeof b.rating === "number");
  } catch (e) {
    console.error(e);
    if (feedbackP) feedbackP.textContent = "Impossible de charger les bières.";
    beers = [];
  }
}

function updateStatus() {
  if (roundSpan) roundSpan.textContent = `Manche ${currentRound}/${MAX_ROUNDS}`;
  if (scoreSpan) scoreSpan.textContent = `Score : ${score}`;
}

function pickRandomPair() {
  if (beers.length < 2) return null;
  const i = Math.floor(Math.random() * beers.length);
  let j;
  do {
    j = Math.floor(Math.random() * beers.length);
  } while (j === i);
  return [beers[i], beers[j]];
}

function renderPair(pair) {
  currentPair = pair;
  hasAnswered = false;

  if (feedbackP) feedbackP.textContent = "";
  if (nextBtn) nextBtn.disabled = true;

  cards.forEach((card, idx) => {
    const beer = pair[idx];
    card.classList.remove("is-correct", "is-wrong");
    card.disabled = false;

    const nameEl = card.querySelector(".note-name");
    const styleEl = card.querySelector(".note-style");
    const ratingEl = card.querySelector(".note-rating");

    if (nameEl) nameEl.textContent = beer.name;
    if (styleEl) styleEl.textContent = beer.style || "";
    if (ratingEl) {
      ratingEl.textContent = `Note : ${beer.rating.toFixed(2)}/20`;
      ratingEl.classList.add("hidden");
    }
  });
}

function showNewPair() {
  const pair = pickRandomPair();
  if (!pair) {
    if (feedbackP) feedbackP.textContent = "Pas assez de bières pour jouer.";
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
    beerA.rating === beerB.rating ? null : beerA.rating > beerB.rating ? beerA : beerB;

  cards.forEach((_card, i) => {
    const card = cards[i];
    const ratingEl = card.querySelector(".note-rating");
    if (ratingEl) ratingEl.classList.remove("hidden");

    card.disabled = true;

    const beer = i === 0 ? beerA : beerB;
    if (correctBeer && beer.name === correctBeer.name) {
      card.classList.add("is-correct");
    }
  });

  if (!feedbackP) return;

  if (!correctBeer) {
    feedbackP.textContent = `Égalité parfaite : ${beerA.rating.toFixed(2)} = ${beerB.rating.toFixed(
      2
    )}. Manche neutre.`;
  } else if (chosen.name === correctBeer.name) {
    score++;
    feedbackP.textContent = `Bonne réponse ! ${correctBeer.name} a la note la plus élevée (${correctBeer.rating.toFixed(
      2
    )}/20).`;
  } else {
    feedbackP.textContent = `Raté ! ${correctBeer.name} a la note la plus élevée (${correctBeer.rating.toFixed(
      2
    )}/20).`;
  }

  updateStatus();
  if (nextBtn) nextBtn.disabled = false;
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
  if (finalScoreP) finalScoreP.textContent = `Tu termines avec un score de ${score}/${MAX_ROUNDS}.`;
  if (endSection) endSection.hidden = false;

  // Pré-remplir pseudo si déjà existant
  if (CURRENT_USER?.id && nameInput) {
    const existing = await getMyUsername(CURRENT_USER.id);
    if (existing) nameInput.value = existing;
  }

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
   Wire + start (uniquement connecté)
========================= */
function startNoteGame(user) {
  CURRENT_USER = user;

  // Normalise l’état UI
  document.body.classList.remove("needs-auth");
  setAuthButtons(true);

  // Reset game
  currentRound = 1;
  score = 0;
  updateStatus();

  if (endSection) endSection.hidden = true;
  setSaveMsg("");

  showNewPair();
  refreshLeaderboardGlobal();
}

/* =========================
   listeners (posés une fois)
========================= */
cards.forEach((card, idx) => {
  card.addEventListener("click", () => handleChoice(idx));
});

if (nextBtn) {
  nextBtn.addEventListener("click", () => nextRound());
}

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
   GO
========================= */
const user = await requireAuthOrRender();
if (user) {
  await loadBeers();
  startNoteGame(user);
}

