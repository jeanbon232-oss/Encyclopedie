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

const cards = Array.from(document.querySelectorAll(".note-card"));

/* =========================
   State
========================= */
let beers = [];
let currentPair = [];
let currentRound = 1;
let score = 0;
let hasAnswered = false;

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

/* Local storage helpers - pas d'authentification */
function loadLocalLeaderboard() {
  try {
    const data = localStorage.getItem("note_game_scores");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveScoreLocally(username, scoreValue) {
  try {
    const scores = loadLocalLeaderboard();
    scores.push({
      username: sanitizeUsername(username),
      score: scoreValue,
      timestamp: Date.now(),
    });
    // Garder juste les top 100
    scores.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
    localStorage.setItem("note_game_scores", JSON.stringify(scores.slice(0, 100)));
    return true;
  } catch {
    return false;
  }
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

function renderLeaderboard(entries) {
  if (!leaderboardList || !leaderboardSection) return;

  leaderboardList.innerHTML = "";
  entries.slice(0, 20).forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${entry.username} — ${entry.score}/${MAX_ROUNDS}`;
    leaderboardList.appendChild(li);
  });

  leaderboardSection.hidden = entries.length === 0;
  if (leaderboardHint) {
    leaderboardHint.textContent = "Classement (stockage local).";
  }
}

function refreshLeaderboard() {
  const entries = loadLocalLeaderboard();
  renderLeaderboard(entries);
}

function endGame() {
  if (finalScoreP) finalScoreP.textContent = `Tu termines avec un score de ${score}/${MAX_ROUNDS}.`;
  if (endSection) endSection.hidden = false;

  refreshLeaderboard();
}

/* =========================
   Save score (localStorage)
========================= */
function saveScore() {
  const pseudo = sanitizeUsername(nameInput?.value);
  if (!pseudo) {
    setSaveMsg("Pseudo requis.", true);
    return;
  }

  setSaveMsg("Enregistrement…");

  if (saveScoreLocally(pseudo, score)) {
    setSaveMsg("Score enregistré (local).");
    refreshLeaderboard();
    if (nameInput) nameInput.value = "";
  } else {
    setSaveMsg("Erreur enregistrement.", true);
  }
}

/* =========================
   Wire + start (uniquement connecté)
========================= */
function startNoteGame() {
  // Reset game
  currentRound = 1;
  score = 0;
  updateStatus();

  if (endSection) endSection.hidden = true;
  setSaveMsg("");

  showNewPair();
  refreshLeaderboard();
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
  saveForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveScore();
  });
}

/* =========================
   GO - Démarrer (sans authentification)
========================= */
(async () => {
  await loadBeers();
  startNoteGame();
})();

