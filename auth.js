import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://wjanwfxbtgvxjgohlliu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYW53ZnhidGd2eGpnb2hsbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzM0MTIsImV4cCI6MjA4MjkwOTQxMn0.3GHwxMSKd1RYagskXzU6QyyVxoJJsfxZV5QeOVmweBk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// IMPORTANT : origine canonique (doit correspondre à Supabase "Site URL")
const SITE = "https://www.bierepedia.com";

const $ = (id) => document.getElementById(id);

function setMsg(text, isError = false) {
  const el = $("msg");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "#b00000" : "#2b2b2b";
}

function cleanUsername(raw) {
  const u = String(raw ?? "").trim();
  if (u.length < 3) return null;
  if (u.length > 20) return null;
  if (!/^[a-zA-Z0-9._\- ]+$/.test(u)) return null;
  return u;
}

/**
 * Retour demandé: auth.html?return=quiz.html
 * Sécurité minimale: on n'accepte que des chemins locaux simples "xxx.html"
 */
function getReturnPathOrDefault() {
  const params = new URLSearchParams(window.location.search);
  const ret = params.get("return");
  if (ret && /^[a-z0-9\-]+\.html$/i.test(ret)) return ret;
  return "accueil.html";
}

function goToReturn() {
  const target = getReturnPathOrDefault();
  window.location.href = `${SITE}/${target}`;
}

async function upsertProfile(userId, username) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, username }, { onConflict: "id" });

  return error;
}

async function redirectIfLoggedIn() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.error("getSession error:", error);

  // Si déjà connecté, on renvoie vers la page demandée (ou accueil.html par défaut)
  if (data?.session) goToReturn();
}

async function signup() {
  setMsg("Création du compte...");

  const email = $("email")?.value?.trim();
  const password = $("password")?.value;

  const username = cleanUsername($("username")?.value);
  if (!username) {
    return setMsg(
      "Pseudo invalide (3–20 caractères, lettres/chiffres/._-).",
      true
    );
  }

  // Si confirmation email activée, l'utilisateur cliquera un lien:
  // on veut le ramener sur auth.html avec le même return, puis auth.js renverra vers return.
  const emailRedirectTo = `${SITE}/auth.html?return=${encodeURIComponent(
    getReturnPathOrDefault()
  )}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { username },
    },
  });

  if (error) return setMsg(error.message, true);

  const userId = data?.user?.id;
  const hasSession = !!data?.session;

  // Si la confirmation email est OFF, on a une session tout de suite
  if (userId && hasSession) {
    const e = await upsertProfile(userId, username);
    if (e) {
      console.error("upsertProfile error:", e);
      return setMsg("Compte créé, mais pseudo non enregistré (RLS ?).", true);
    }
    setMsg("Compte créé. Pseudo enregistré.");
    goToReturn();
    return;
  }

  // Si confirmation email ON: pas de session => on garde le pseudo pour l'écrire au 1er login
  localStorage.setItem("pending_username", username);
  setMsg("Compte créé. Vérifie tes emails si la confirmation est activée.");
}

async function login() {
  setMsg("Connexion...");

  const email = $("email")?.value?.trim();
  const password = $("password")?.value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return setMsg(error.message, true);

  const user = data?.session?.user;
  if (!user) return setMsg("Connexion non établie. Réessaie.", true);

  // 1) prioritaire: username venant de user_metadata
  // 2) fallback: celui stocké lors du signup (si confirmation email activée)
  const metaUsername = cleanUsername(user.user_metadata?.username);
  const pendingUsername = cleanUsername(localStorage.getItem("pending_username"));
  const username = metaUsername || pendingUsername;

  if (username) {
    const e = await upsertProfile(user.id, username);
    if (e) console.error("upsertProfile error:", e);
    localStorage.removeItem("pending_username");
  }

  goToReturn();
}

async function resetPassword() {
  const email = $("email")?.value?.trim();
  if (!email) return setMsg("Renseigne ton email d’abord.", true);

  setMsg("Envoi du mail de réinitialisation...");

  // Après reset, on revient sur auth.html (et on conserve return si présent)
  const redirectTo = `${SITE}/auth.html?return=${encodeURIComponent(
    getReturnPathOrDefault()
  )}`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) return setMsg(error.message, true);
  setMsg("Mail envoyé (si l’adresse existe).");
}

$("signupBtn")?.addEventListener("click", signup);
$("loginBtn")?.addEventListener("click", login);
$("resetBtn")?.addEventListener("click", resetPassword);

redirectIfLoggedIn();
