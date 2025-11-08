// --- Données du quiz (tu peux en ajouter) ---
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
    correct: "Non,pas du tout"
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
    question: "Quelle bière fait référence au titre d'une célèbre émission culinaire animée par le chef Philippe Etchebest ?",
    options: ["Sanglipa", "Affligem Blonde", "La grisette bio"],
    correct: "Sanglipa"
  },
  {
    question: "Quelle bière propose une nourriture qui ne nécessite pas un processus de cuisson au four ?",
    options: ["Hertog Jan Bockbier", "Palm", "St Hubrtus Tripel Blond"],
    correct: "St Hubertus Tripel Blond"
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

function maybeShowFinalScore() {
  if (answeredCount === quizData.length) {
    const box = document.createElement("div");
    box.className = "score-box";
    const note = (score === quizData.length)
      ? "Parfait ! 🍾"
      : (score === 0 ? "Zéro pointé… mais avec panache 😅" : "Pas mal !");
    box.innerHTML = `
      <h3>Score final : ${score}/${quizData.length}</h3>
      <p>${note}</p>
      <button class="btn btn-restart" type="button">Recommencer</button>
    `;
    container.appendChild(box);

    box.querySelector(".btn-restart").addEventListener("click", () => {
      location.reload();
    });
  }
}

// Génération des cartes questions
quizData.forEach((q, i) => {
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

  // Un seul clic possible : après réponse, on verrouille les boutons
  let locked = false;

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (locked) return;
      locked = true;

      // Verrouille toutes les options pour cette question
      buttons.forEach(b => {
        b.disabled = true;
      });

      const chosen = btn.textContent.trim();
      if (chosen === q.correct) {
        score++;
        btn.classList.add("is-correct");
        result.textContent = "✅ Bonne réponse !";
        result.classList.add("ok");
      } else {
        btn.classList.add("is-wrong");
        // On ne révèle PAS la bonne réponse :
        const msg = WRONG_REACTIONS[Math.floor(Math.random() * WRONG_REACTIONS.length)];
        result.textContent = `❌ ${msg}`;
        result.classList.add("ko");
      }

      answeredCount++;
      maybeShowFinalScore();
    });
  });
});
