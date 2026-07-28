/* ============================= */
/* QUIZ - Accès libre          */
/* ============================= */

const container = document.getElementById("quiz-container");

function startQuiz() {
  if (!container) return;

  // Nettoyage
  container.innerHTML = "";

  /* Data du quiz */
  const quizData = [
    {
      question: "Quelle est la meilleure Duvel ?",
      options: ["Duvel 666", "Duvel Imperial Blond", "Duvel Tripel Hop"],
      correct: "Duvel Tripel Hop",
    },
    {
      question: "Quelle bière n'évoque pas l'oxydation ?",
      options: ["Leffe Ambrée", "Piraat", "Grimbergen Prestige"],
      correct: "Leffe Ambrée",
    },
    {
      question: "Laquelle ne concerne pas un oiseau de proie ?",
      options: ["La Frangine", "Jungle Joy", "Chimay Bleue"],
      correct: "La Frangine",
    },
    {
      question: "De quelle époque date l'herbier évoqué par l'Ipanema",
      options: ["XVIème", "XXème", "XVIIIème"],
      correct: "XVIIIème",
    },
    {
      question: "Parmi ces bières traduisant un danger, lequel est le plus critique",
      options: ["Tongerlo Brune", "Ramée Triple", "St Feuillien Quadruple"],
      correct: "St Feuillien Quadruple",
    },
    {
      question: "Brugse Zot : Le Page a-t-il dérangé le roy ?",
      options: ["Oui mais il est pardonné", "Non, pas du tout", "Oui, et il sera pendu"],
      correct: "Non, pas du tout",
    },
    {
      question: "Combien de temps peut-on espérer en rodéo sur la Bush Noël ?",
      options: ["6 secondes maximum", "autour de 20 secondes", "3 secondes"],
      correct: "6 secondes maximum",
    },
    {
      question: "Quelle bière ne développe absolument aucun aspect animal ?",
      options: ["Bavik", "Bertimpchamps Hiver", "Bière des Amis"],
      correct: "Bière des Amis",
    },
    {
      question: "Quelle bière ne nécessite pas un sens gustatif ?",
      options: ["Brasserie du Caméléon", "Brasserie du mont Blanc la blanche", "Trinité"],
      correct: "Trinité",
    },
    {
      question: "Quelle bière ne fait pas intervenir un objet au fond d'un contenant de liquide ?",
      options: ["Galgbacken IPA", "La Corne noire", "Atlas"],
      correct: "La Corne noire",
    },
    {
      question: "Depuis quel siècle les squelettes de la Bière du DEMON reposent-ils au fond du lac ?",
      options: ["XVIIIᵉ siècle (PCN)", "IVᵉ siècle (ACN)", "XIᵉ siècle (PCN)"],
      correct: "XVIIIᵉ siècle (PCN)",
    },
    {
      question: "Quelle bière n'évoque pas le radis ?",
      options: ["Chimay Dorée", "Atlas", "Zundert"],
      correct: "Zundert",
    },
    {
      question: "Quelle bière nous transporte au cœur d'une cheminée sous-marine ?",
      options: ["Brugge Tripel", "Carlsberg", "Grimbergen Prestige"],
      correct: "Brugge Tripel",
    },
    {
      question:
        "Quelle bière fait référence au titre d'une célèbre émission culinaire animée par le chef Philippe Etchebest ?",
      options: ["Sanglipa", "Affligem Blonde", "La grisette bio"],
      correct: "Sanglipa",
    },
    {
      question: "Quelle bière propose une nourriture qui ne nécessite pas un processus de cuisson au four ?",
      options: ["Hertog Jan Bockbier", "Palm", "St Hubertus Tripel Blond"],
      correct: "St Hubertus Tripel Blond",
    },
    {
      question: "Quelle bière n’évoque pas de présence infantile ?",
      options: ["La Tharée Triple", "Maredsous Brune", "Guinness"],
      correct: "Guinness",
    },
    {
      question: "Laquelle de ces bières propose un amalgame végétal plutôt que métallique ?",
      options: ["Zinnebier", "Blanche de Wissant", "Grimbergen Prestige"],
      correct: "Zinnebier",
    },
    {
      question: "Super 8 IPA : Pourquoi le bourgeois n’obtient pas son titre de noblesse ?",
      options: [
        "Ses suppliques suscitent le dédain",
        "Sa naissance ternit sa valeur",
        "Son projet rebute les conservateurs",
      ],
      correct: "Son projet rebute les conservateurs",
    },
    {
      question: "Laquelle de ces bières évoque une peinture qui n’a pas pu être réalisée à l’huile ?",
      options: ["Bronzen Baron", "Saison de Dottignies", "V Cense"],
      correct: "Saison de Dottignies",
    },
    {
      question: "Strandlover Velskabt Wit : Pourquoi le charpentier trempe-t-il le bois dans une solution chaude ?",
      options: ["Pour le protéger des parasites", "Pour l’assouplir", "Pour changer sa teinte"],
      correct: "Pour l’assouplir",
    },
    {
      question: "Brigand (+4) : De quoi est rempli le sac lié à une corde dont la rigidité surprend le brigand ?",
      options: ["De gravier", "De grain", "De fruits séchés"],
      correct: "De grain",
    },
    {
      question: "Le couronnement de la Trinité est-il légitime ?",
      options: ["Oui", "Non", "Il l'était"],
      correct: "Oui",
    },
    {
      question: "Laquelle n'a aucun lien avec les champignons ?",
      options: ["Leopold 7", "Bavik", "Bisous M'chou", "Ommegang Triple", "La Frangine"],
      correct: "La Frangine",
    },
  ];

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
    "Améliore toi",
  ];

  let score = 0;
  let answeredCount = 0;
  let correctAnswers = 0;
  let streak = 0;
  let wrongStreak = 0;
  const MAX_GAUGE = 100;

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

  const enrichedQuestions = quizData.map((q, index) => ({
    ...q,
    difficulty: q.difficulty ?? (index % 5 === 0 ? "hard" : index % 4 === 0 ? "easy" : "medium"),
    value: q.value ?? (index % 5 === 0 ? 12 : index % 4 === 0 ? 5 : 8),
  }));

  const selectedQuestions = shuffleArray([...enrichedQuestions]).slice(0, QUESTIONS_PER_RUN);
  const TOTAL_QUESTIONS = selectedQuestions.length;

  const progressBox = document.createElement("div");
  progressBox.className = "quiz-progress";
  progressBox.innerHTML = `
    <div class="quiz-progress__header">
      <strong>Jauge : <span id="quiz-gauge-value">0/100</span></strong>
      <span id="quiz-streak-pill" class="quiz-streak-pill">Streak : 0</span>
    </div>
    <div class="quiz-progress-bar">
      <div id="quiz-progress-fill" class="quiz-progress-fill"></div>
    </div>
    <p id="quiz-progress-text" class="quiz-progress-text">
      Une bonne réponse fait monter la jauge, et un streak plus long augmente encore le gain.
    </p>
  `;
  container.appendChild(progressBox);

  const gaugeValueEl = progressBox.querySelector("#quiz-gauge-value");
  const streakEl = progressBox.querySelector("#quiz-streak-pill");
  const fillEl = progressBox.querySelector("#quiz-progress-fill");
  const progressTextEl = progressBox.querySelector("#quiz-progress-text");

  function updateProgressUI(message = "") {
    gaugeValueEl.textContent = `${score}/${MAX_GAUGE}`;
    streakEl.textContent = `Streak : ${streak}`;
    fillEl.style.width = `${Math.min(MAX_GAUGE, score)}%`;
    if (message) {
      progressTextEl.textContent = message;
    }
  }

  updateProgressUI();

  /* Local storage helpers - pas d'authentification requise */
  function sanitizeUsername(v) {
    return String(v ?? "").trim().slice(0, 20);
  }

  function loadLocalLeaderboard() {
    try {
      const data = localStorage.getItem("quiz_scores");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveScoreLocally(username, scoreValue, totalValue) {
    try {
      const scores = loadLocalLeaderboard();
      scores.push({
        username: sanitizeUsername(username),
        score: scoreValue,
        total: totalValue,
        timestamp: Date.now(),
      });
      // Garder juste les top 100
      scores.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
      localStorage.setItem("quiz_scores", JSON.stringify(scores.slice(0, 100)));
      return true;
    } catch {
      return false;
    }
  }

  /* -----------------------------
     Fin de quiz : score + save + leaderboard
  ----------------------------- */
  function maybeShowFinalScore() {
    if (answeredCount !== TOTAL_QUESTIONS) return;

    const box = document.createElement("div");
    box.className = "score-box";

    const pct = Math.round((score / MAX_GAUGE) * 100);

    const TIERS = [
      {
        id: "parfait",
        min: 100,
        msgs: [
          "Tu as probablement triché donc je ne vais pas trop te féliciter",
          "Impossible d'atteindre ce score du premier coup, et si c'est le cas, je n'ai pas les mots.",
        ],
      },
      {
        id: "tres-bon",
        min: 90,
        msgs: [
          "Score tellement élevé que ça devient suspect...",
          "Comment est-ce possible si ce n'est de la chance? Félicitations !",
        ],
      },
      {
        id: "bon",
        min: 75,
        msgs: [
          "Très belle lecture du carnet. Chapeau bas de la part des experts.",
          "Solide prestation, on sent l’expérience.",
        ],
      },
      {
        id: "correct",
        min: 60,
        msgs: [
          "On sent que la lecture a été attentive",
          "Bravo, un tel score traduit une lecture attentive.",
          "Tu peux monter d’un cran avec un peu plus d'expérience.",
        ],
      },
      {
        id: "moyen",
        min: 40,
        msgs: [
          "Moyen. Encore un chapitre du carnet ce soir ?",
          "Bof mais tu as du potentiel… remets-toi à la lecture.",
          "On a vu pire, on a vu mieux.",
        ],
      },
      {
        id: "pas-bon",
        min: 25,
        msgs: [
          "Pas bon. Remets-toi de suite à la lecture.",
          "Aïe… Ce score est presque insultant pour les experts.",
          "On révise d'abord puis on s'y remet.",
        ],
      },
      {
        id: "nul",
        min: 0,
        msgs: [
          "Nul. La honte des lecteurs. As-tu seulement ouvert le carnet ?",
          "Merci pour l'effort mais ça le fait pas du tout. Relis.",
          "Un score aussi mauvais faut le faire, relis l'entièreté du carnet tout de suite.",
        ],
      },
    ];

    let tier = TIERS.find((t) => pct >= t.min);
    if (!tier) tier = TIERS[TIERS.length - 1];
    const note = tier.msgs[Math.floor(Math.random() * tier.msgs.length)];

    box.setAttribute("data-tier", tier.id);

    box.innerHTML = `
      <h3>Jauge finale : ${score}/${MAX_GAUGE} (${pct}%)</h3>
      <p>${note}</p>
      <p class="quiz-summary">Réponses justes : ${correctAnswers}/${TOTAL_QUESTIONS}</p>

      <form id="quiz-save-form" style="display:grid; gap:10px; margin-top:12px;">
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
        <p class="note-game__hint" style="margin-top:8px;">
          Classement basé sur les meilleurs scores, puis les plus récents.
        </p>
      </div>

      <button class="btn btn-restart" type="button" style="margin-top: 12px;">Recommencer</button>
    `;

    container.appendChild(box);

    box.querySelector(".btn-restart").addEventListener("click", () => location.reload());

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
      entries.slice(0, 20).forEach((e, i) => {
        const li = document.createElement("li");
        li.textContent = `${i + 1}. ${e.username} — ${e.score}/${e.total}`;
        lbListEl.appendChild(li);
      });
      lbWrapEl.hidden = entries.length === 0;
    }

    function refreshLeaderboard() {
      const entries = loadLocalLeaderboard();
      renderLeaderboard(entries);
    }

    // Initialiser le leaderboard
    refreshLeaderboard();

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      setMsg("");

      const pseudo = sanitizeUsername(usernameEl.value);
      if (!pseudo) return setMsg("Pseudo requis.", true);

      setMsg("Enregistrement…");

      if (saveScoreLocally(pseudo, score, MAX_GAUGE)) {
        setMsg("Score enregistré (local).");
        refreshLeaderboard();
      } else {
        setMsg("Erreur enregistrement.", true);
      }
    });
  }

  /* ============================= */
  /* Générer les cartes questions */
  /* ============================= */
  selectedQuestions.forEach((q, i) => {
    const div = document.createElement("div");
    div.className = "question-card";
    div.innerHTML = `
      <h2>${i + 1}. ${q.question}</h2>
      <div class="options">
        ${q.options.map((opt) => `<button class="option-btn" type="button">${opt}</button>`).join("")}
      </div>
      <p class="result" aria-live="polite"></p>
    `;
    container.appendChild(div);

    const buttons = Array.from(div.querySelectorAll(".option-btn"));
    const result = div.querySelector(".result");
    let locked = false;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (locked) return;
        locked = true;

        buttons.forEach((b) => (b.disabled = true));

        const chosen = btn.textContent.trim();
        if (chosen === q.correct) {
          const gain = Math.min(MAX_GAUGE - score, Math.max(10, (q.value ?? 8) + streak * 5));
          score = Math.min(MAX_GAUGE, score + gain);
          streak += 1;
          wrongStreak = 0;
          correctAnswers += 1;
          btn.classList.add("is-correct");
          result.textContent = `✅ Bonne réponse ! +${gain} sur la jauge`;
          result.classList.add("ok");
          updateProgressUI(`Streak x${streak} : la bonne réponse a fait monter la jauge de ${gain}.`);
        } else {
          const penalty = wrongStreak === 0 ? 5 : wrongStreak === 1 ? 7 : 10;
          score = Math.max(0, score - penalty);
          wrongStreak += 1;
          streak = 0;
          btn.classList.add("is-wrong");
          const msg = WRONG_REACTIONS[Math.floor(Math.random() * WRONG_REACTIONS.length)];
          result.textContent = `❌ ${msg}`;
          result.classList.add("ko");
          updateProgressUI(
            wrongStreak === 1
              ? `Raté : la jauge perd ${penalty} points.`
              : `Raté : la jauge perd ${penalty} points (${wrongStreak}e mauvaise d'affilée).`
          );
        }

        answeredCount++;
        maybeShowFinalScore();
      });
    });
  });
}

/* Lancer le quiz directement (sans authentification) */
startQuiz();

