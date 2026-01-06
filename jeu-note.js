import { supabase, setupAuthUI } from "./auth-ui.js";
const CURRENT_USER = await setupAuthUI();

const MAX_ROUNDS = 10;
const LEADERBOARD_KEY = "bierpedia_note_game_leaderboard";

let beers = [];
let currentPair = [];
let currentRound = 1;
let score = 0;
let hasAnswered = false;

const roundSpan = document.getElementById("ng-round");
const scoreSpan = document.getElementById("ng-score");
const feedbackP = document.getElementById("ng-feedback");
const nextBtn = document.getElementById("ng-next");
const endSection = document.getElementById("ng-end");
const finalScoreP = document.getElementById("ng-final-score");
const saveForm = document.getElementById("ng-save-form");
const nameInput = document.getElementById("ng-name");
const leaderboardSection = document.getElementById("ng-leaderboard");
const leaderboardList = document.getElementById("ng-leaderboard-list");

const cards = Array.from(document.querySelectorAll(".note-card"));

async function loadBeers() {
  try {
    const res = await fetch("beers.json");
    beers = await res.json();
    // on filtre les bières sans note
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
  loadLeaderboard();
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
  const other = idx === 0 ? beerB : beerA;

  const correctBeer = beerA.rating === beerB.rating
    ? null
    : (beerA.rating > beerB.rating ? beerA : beerB);

  cards.forEach((card, i) => {
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

function endGame() {
  finalScoreP.textContent = `Tu termines avec un score de ${score}/${MAX_ROUNDS}.`;
  endSection.hidden = false;
}

function loadLeaderboard() {
  const raw = localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) return;
  try {
    const entries = JSON.parse(raw);
    renderLeaderboard(entries);
  } catch (e) {
    console.error("Erreur leaderboard", e);
  }
}

function saveLeaderboardEntry(name, score) {
  const raw = localStorage.getItem(LEADERBOARD_KEY);
  let entries = [];
  if (raw) {
    try {
      entries = JSON.parse(raw);
    } catch {
      entries = [];
    }
  }

  entries.push({
    name: name.trim(),
    score,
    date: new Date().toISOString()
  });

  // tri: meilleur score d'abord
  entries.sort((a, b) => b.score - a.score);
  // on garde les 20 meilleurs
  entries = entries.slice(0, 20);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  renderLeaderboard(entries);
}

function renderLeaderboard(entries) {
  leaderboardList.innerHTML = "";
  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${entry.name} — ${entry.score}/${MAX_ROUNDS}`;
    leaderboardList.appendChild(li);
  });
  leaderboardSection.hidden = entries.length === 0;
}

// listeners
cards.forEach((card, idx) => {
  card.addEventListener("click", () => handleChoice(idx));
});

nextBtn.addEventListener("click", () => {
  nextRound();
});

saveForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) return;
  saveLeaderboardEntry(name, score);
  saveForm.reset();
});

// go !
loadBeers();

