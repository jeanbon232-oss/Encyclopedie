import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://wjanwfxbtgvxjgohlliu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYW53ZnhidGd2eGpnb2hsbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzM0MTIsImV4cCI6MjA4MjkwOTQxMn0.3GHwxMSKd1RYagskXzU6QyyVxoJJsfxZV5QeOVmweBk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function requireAuth() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("getSession error:", error);
  }
  if (!data?.session) {
    const returnTo = encodeURIComponent("quiz.html");
    window.location.href = `auth.html?return=${returnTo}`;
    return null;
  }
  return data.session.user;
}

// Empêche l’exécution du quiz si pas loggé
const user = await requireAuth();
if (!user) throw new Error("Not authenticated");



import { supabase, setupAuthUI } from "./auth-ui.js";


let CURRENT_USER = await setupAuthUI();

/* -----------------------------
   Données du quiz (pool complet)
----------------------------- */
const quizData = [
  {
    question: "Quelle est la meilleure Duvel ?",
    options: ["Duvel 666", "Duvel Imperial Blond", "Duvel Tripel Hop"],
    correct: "Duvel Tripel Hop"
  },
  {
    question: "Quelle bière n'évoque pas l'oxydation ?",
    options: ["Leffe Ambrée", "Piraat", "Grimbergen Prestige"],
    correct: "Leffe Ambrée"
  },
  {
    question: "Laquelle ne concerne pas un oiseau de proie ?",
    options: ["La Frangine", "Jungle Joy", "Chimay Bleue"],
    correct: "La Frangine"
  },
  {
    question: "De quelle époque date l'herbier évoqué par l'Ipanema",
    options: ["XVIème", "XXème", "XVIIIème"],
    correct: "XVIIIème"
  },
  {
    question: "Parmi ces bières traduisant un danger, lequel est le plus critique",
    options: ["Tongerlo Brune", "Ramée Triple", "St Feuillien Quadruple"],
    correct: "St Feuillien Quadruple"
  },
  {
    question: "Brugse Zot : Le Page a-t-il dérangé le roy ?",
    options: ["Oui mais il est pardonné", "Non, pas du tout", "Oui, et il sera pendu"],
    correct: "Non, pas du tout"
  },
  {
    question: "Combien de temps peut-on espérer en rodéo sur la Bush Noël ?",
    options: ["6 secondes maximum", "autour de 20 secondes", "3 secondes"],
    correct: "6 secondes maximum"
  },
  {
    question: "Quelle bière ne développe absolument aucun aspect animal ?",
    options: ["Bavik", "Bertimpchamps Hiver", "Bière des Amis"],
    correct: "Bière des Amis"
  },
  {
    question: "Quelle bière ne nécessite pas un sens gustatif ?",
    options: ["Brasserie du Caméléon", "Brasserie du mont Blanc la blanche", "Trinité"],
    correct: "Trinité"
  },
  {
    question: "Quelle bière ne fait pas intervenir un objet au fond d'un contenant de liquide ?",
    options: ["Galgbacken IPA", "La Corne noire", "Atlas"],
    correct: "La Corne noire"
  },
  {
    question: "Depuis quel siècle les squelettes de la Bière du DEMON reposent-ils au fond du lac ?",
    options: ["XVIIIᵉ siècle (PCN)", "IVᵉ siècle (ACN)", "XIᵉ siècle (PCN)"],
    correct: "XVIIIᵉ siècle (PCN)"
  },
  {
    question: "Quelle bière n'évoque pas le radis ?",
    options: ["Chimay Dorée", "Atlas", "Zundert"],
    correct: "Zundert"
  },
  {
    question: "Quelle bière nous transporte au cœur d'une cheminée sous-marine ?",
    options: ["Brugge Tripel", "Carlsberg", "Grimbergen Prestige"],
    correct: "Brugge Tripel"
  },
  {
    question:
      "Quelle bière fait référence au titre d'une célèbre émission culinaire animée par le chef Philippe Etchebest ?",
    options: ["Sanglipa", "Affligem Blonde", "La grisette bio"],
    correct: "Sanglipa"
  },
  {
    question: "Quelle bière propose une nourriture qui ne nécessite pas un processus de cuisson au four ?",
    options: ["Hertog Jan Bockbier", "Palm", "St Hubertus Tripel Blond"],
    correct: "St Hubertus Tripel Blond"
  },
  {
    question: "Quelle bière n’évoque pas de présence infantile ?",
    options: ["La Tharée Triple", "Maredsous Brune", "Guinness"],
    correct: "Guinness"
  },
  {
    question: "Laquelle de ces bières propose un amalgame végétal plutôt que métallique ?",
    options: ["Zinnebier", "Blanche de Wissant", "Grimbergen Prestige"],
    correct: "Zinnebier"
  },
  {
    question: "Super 8 IPA : Pourquoi le bourgeois n’obtient pas son titre de noblesse ?",
    options: ["Ses suppliques suscitent le dédain", "Sa naissance ternit sa valeur", "Son projet rebute les conservateurs"],
    correct: "Son projet rebute les conservateurs"
  },
  {
    question: "Laquelle de ces bières évoque une peinture qui n’a pas pu être réalisée à l’huile ?",
    options: ["Bronzen Baron", "Saison de Dottignies", "V Cense"],
    correct: "Saison de Dottignies"
  },
  {
    question:
      "Strandlover Velskabt Wit : Pourquoi le charpentier trempe-t-il le bois dans une solution chaude ?",
    options: ["Pour le protéger des parasites", "Pour l’assouplir", "Pour changer sa teinte"],
    correct: "Pour l’assouplir"
  }
];

// Répliques pour les mauvaises réponses (aléatoires)
const WRONG_REACTIONS = [
  "Non, pas du tout",
  "Ridicule.",
  "Très décalé…",
  "À côté de la plaque.",
  "Aucun effort !",
  "Non.",
  "On s’éloigne.",
  "Pas la peine de faire le quiz si c’est pour répondre ça",
  "Nul",
  "C'est vraiment pas ça",
  "La pire réponse possible",
  "Evidemment raté",
  "Améliore toi"
];

const container = document.getElementById("quiz-container");

let score = 0;
let answeredCount = 0;

/* -----------------------------
   Tirage aléatoire de 10 questions
----------------------------- */
const QUESTIONS_PER_RUN = 10;

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const selectedQuestions = shuffleArray([...quizData]).slice(0, QUESTIONS_PER_RUN);
const TOTAL_QUESTIONS = selectedQuestions.length;

/* -----------------------------
   Supabase helpers (pseudo + scores)
----------------------------- */
function sanitizeUsername(v) {
  return String(v ?? "").trim().slice(0, 20);
}

async function refreshCurrentUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  CURRENT_USER = data?.session?.user ?? null;
  return CURRENT_USER;
}

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
  if (!u) return { error: { message: "Pseudo requis." } };

  // nécessite UPDATE own et (si row absente) INSERT own sur profiles
  return await supabase
    .from("profiles")
    .upsert({ id: userId, username: u }, { onConflict: "id" });
}

async function insertQuizScore(userId, scoreValue, totalValue) {
  return await supabase
    .from("quiz_scores")
    .insert({ user_id: userId, score: scoreValue, total: totalValue });
}

async function loadQuizLeaderboardTop20() {
  // On récupère les scores, puis les pseudos correspondants
  const { data: scoresRows, error: sErr } = await supabase
    .from("quiz_scores")
    .select("user_id, score, total, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  if (sErr) {
    console.error("quiz_scores select error:", sErr);
    return [];
  }

  const rows = scoresRows ?? [];
  const ids = [...new Set(rows.map(r => r.user_id).filter(Boolean))];

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
    total: r.total
  }));
}

/* -----------------------------
   Fin de quiz : score + save + leaderboard
----------------------------- */
function maybeShowFinalScore() {
  if (answeredCount !== TOTAL_QUESTIONS) return;

  const box = document.createElement("div");
  box.className = "score-box";

  const pct = Math.round((score / TOTAL_QUESTIONS) * 100);

  const TIERS = [
    { id: "parfait", min: 100, msgs: [
      "Tu as probablement triché donc je ne vais pas trop te féliciter",
      "Impossible d'atteindre ce score du premier coup, et si c'est le cas, je n'ai pas les mots."
    ]},
    { id: "tres-bon", min: 90, msgs: [
      "Score tellement élevé que ça devient suspect...",
      "Comment est-ce possible si ce n'est de la chance? Félicitations !"
    ]},
    { id: "bon", min: 75, msgs: [
      "Très belle lecture du carnet. Chapeau bas de la part des experts.",
      "Solide prestation, on sent l’expérience.",
    ]},
    { id: "correct", min: 60, msgs: [
      "On sent que la lecture a été attentive",
      "Bravo, un tel score traduit une lecture attentive.",
      "Tu peux monter d’un cran avec un peu plus d'expérience."
    ]},
    { id: "moyen", min: 40, msgs: [
      "Moyen. Encore un chapitre du carnet ce soir ?",
      "Bof mais tu as du potentiel… remets-toi à la lecture.",
      "On a vu pire, on a vu mieux."
    ]},
    { id: "pas-bon", min: 25, msgs: [
      "Pas bon. Remets-toi de suite à la lecture.",
      "Aïe… Ce score est presque insultant pour les experts.",
      "On révise d'abord puis on s'y remet."
    ]},
    { id: "nul", min: 0, msgs: [
      "Nul. La honte des lecteurs. As-tu seulement ouvert le carnet ?",
      "Merci pour l'effort mais ça le fait pas du tout. Relis.",
      "Un score aussi mauvais faut le faire, relis l'entièreté du carnet tout de suite."
    ]}
  ];

  let tier = TIERS.find(t => pct >= t.min);
  if (!tier) tier = TIERS[TIERS.length - 1];

  const note = tier.msgs[Math.floor(Math.random() * tier.msgs.length)];

  box.setAttribute("data-tier", tier.id);

  // UI leaderboard + save
  box.innerHTML = `
    <h3>Score final : ${score}/${TOTAL_QUESTIONS} (${pct}%)</h3>
    <p>${note}</p>

    <div id="quiz-auth-hint" style="margin-top:12px;" hidden>
      <a href="auth.html" class="btn">Se connecter pour apparaître dans le classement</a>
    </div>

    <form id="quiz-save-form" style="display:grid; gap:10px; margin-top:12px;" hidden>
      <label>
        Ton pseudo :
        <input id="quiz-username" type="text" maxlength="20" required style="max-width:280px;">
      </label>
      <button class="btn" type="submit">Enregistrer dans le classement</button>
      <p id="quiz-save-msg" class="result" aria-live="polite"></p>
    </form>

    <div id="quiz-leaderboard" style="margin-top:16px;" hidden>
      <h4 style="margin: 0 0 8px 0;">Top 20 (global)</h4>
      <ol id="quiz-leaderboard-list" style="text-align:left; margin:0; padding-left: 20px;"></ol>
      <p class="note-game__hint" style="margin-top:8px;">Classement basé sur les meilleurs scores, puis les plus récents.</p>
    </div>

    <button class="btn btn-restart" type="button" style="margin-top: 12px;">Recommencer</button>
  `;

  container.appendChild(box);

  box.querySelector(".btn-restart").addEventListener("click", () => location.reload());

  // Wire up logic
  const authHintEl = box.querySelector("#quiz-auth-hint");
  const formEl = box.querySelector("#quiz-save-form");
  const usernameEl = box.querySelector("#quiz-username");
  const msgEl = box.querySelector("#quiz-save-msg");
  const lbWrapEl = box.querySelector("#quiz-leaderboard");
  const lbListEl = box.querySelector("#quiz-leaderboard-list");

  function setMsg(t, isError = false) {
    msgEl.textContent = t || "";
    msgEl.classList.toggle("ko", !!isError);
    msgEl.classList.toggle("ok", !isError && !!t);
  }

  function renderLeaderboard(entries) {
    lbListEl.innerHTML = "";
    entries.forEach((e, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${e.username} — ${e.score}/${e.total}`;
      lbListEl.appendChild(li);
    });
    lbWrapEl.hidden = entries.length === 0;
  }

  async function refreshLeaderboard() {
    const entries = await loadQuizLeaderboardTop20();
    renderLeaderboard(entries);
  }

  (async () => {
    await refreshLeaderboard();

    const user = await refreshCurrentUser();
    if (!user) {
      authHintEl.hidden = false;
      formEl.hidden = true;
      return;
    }

    authHintEl.hidden = true;
    formEl.hidden = false;

    const existing = await getMyUsername(user.id);
    if (existing) usernameEl.value = existing;

    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      setMsg("");

      const pseudo = sanitizeUsername(usernameEl.value);
      if (!pseudo) return setMsg("Pseudo requis.", true);

      setMsg("Enregistrement…");

      const { error: uErr } = await upsertMyUsername(user.id, pseudo);
      if (uErr) return setMsg(uErr.message || "Erreur pseudo.", true);

      const { error: sErr } = await insertQuizScore(user.id, score, TOTAL_QUESTIONS);
      if (sErr) {
        console.error("quiz_scores insert error:", sErr);
        return setMsg(sErr.message || "Erreur enregistrement score.", true);
      }

      setMsg("Score enregistré.");
      await refreshLeaderboard();
    });
  })();
}

/* -----------------------------
   Génération des cartes questions
----------------------------- */
selectedQuestions.forEach((q, i) => {
  const div = document.createElement("div");
  div.className = "question-card";
  div.innerHTML = `
    <h2>${i + 1}. ${q.question}</h2>
    <div class="options">
      ${q.options.map(opt => `<button class="option-btn" type="button">${opt}</button>`).join("")}
    </div>
    <p class="result" aria-live="polite"></p>
  `;
  container.appendChild(div);

  const buttons = Array.from(div.querySelectorAll(".option-btn"));
  const result = div.querySelector(".result");

  let locked = false;

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (locked) return;
      locked = true;

      buttons.forEach(b => (b.disabled = true));

      const chosen = btn.textContent.trim();
      if (chosen === q.correct) {
        score++;
        btn.classList.add("is-correct");
        result.textContent = "✅ Bonne réponse !";
        result.classList.add("ok");
      } else {
        btn.classList.add("is-wrong");
        const msg = WRONG_REACTIONS[Math.floor(Math.random() * WRONG_REACTIONS.length)];
        result.textContent = `❌ ${msg}`;
        result.classList.add("ko");
      }

      answeredCount++;
      maybeShowFinalScore();
    });
  });
});









