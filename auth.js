import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://wjanwfxbtgvxjgohlliu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYW53ZnhidGd2eGpnb2hsbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzM0MTIsImV4cCI6MjA4MjkwOTQxMn0.3GHwxMSKd1RYagskXzU6QyyVxoJJsfxZV5QeOVmweBk";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// IMPORTANT : origine canonique (doit correspondre à Supabase "Site URL")
const SITE = "https://www.bierepedia.com";

const $ = (id) => document.getElementById(id);

function setMsg(text, isError = false) {
  const el = $("msg");
  el.textContent = text;
  el.style.color = isError ? "#b00000" : "#2b2b2b";
}

function cleanUsername(raw) {
  const u = String(raw ?? "").trim();
  // règles simples: 3-20 chars, lettres/chiffres/._- et espaces (optionnel)
  // Ajuste selon ton goût.
  if (u.length < 3) return null;
  if (u.length > 20) return null;
  if (!/^[a-zA-Z0-9._\- ]+$/.test(u)) return null;
  return u;
}

async function upsertProfile(userId, username) {
  // suppose: public.profiles(id uuid primary key references auth.users, username text)
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, username }, { onConflict: "id" });

  return error;
}

async function redirectIfLoggedIn() {
  const { data } = await supabase.auth.getSession();
  if (data?.session) window.location.href = `${SITE}/accueil.html`;
}

async function signup() {
  setMsg("Création du compte...");

  const email = $("email").value.trim();
  const password = $("password").value;

  const username = cleanUsername($("username")?.value);
  if (!username) {
    return setMsg("Pseudo invalide (3–20 caractères, lettres/chiffres/._-).", true);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${SITE}/accueil.html`,
      // stocké dans auth.users.raw_user_meta_data
      data: { username }
    },
  });

  if (error) return setMsg(error.message, true);

  // Si la confirmation email est OFF, on a souvent une session tout de suite -> on peut écrire profiles
  const userId = data?.user?.id;
  const hasSession = !!data?.session;

  if (userId && hasSession) {
    const e = await upsertProfile(userId, username);
    if (e) {
      console.error("upsertProfile error:", e);
      return setMsg("Compte créé, mais pseudo non enregistré (RLS ?).", true);
    }
    setMsg("Compte créé. Pseudo enregistré.");
    window.location.href = `${SITE}/accueil.html`;
    return;
  }

  // Si confirmation email ON: pas de session => on garde le pseudo pour l'écrire au 1er login
  localStorage.setItem("pending_username", username);
  setMsg("Compte créé. Vérifie tes emails si la confirmation est activée.");
}

async function login() {
  setMsg("Connexion...");

  const email = $("email").value.trim();
  const password = $("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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

  window.location.href = `${SITE}/accueil.html`;
}

async function resetPassword() {
  const email = $("email").value.trim();
  if (!email) return setMsg("Renseigne ton email d’abord.", true);

  setMsg("Envoi du mail de réinitialisation...");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE}/auth.html`,
  });

  if (error) return setMsg(error.message, true);
  setMsg("Mail envoyé (si l’adresse existe).");
}

$("signupBtn").addEventListener("click", signup);
$("loginBtn").addEventListener("click", login);
$("resetBtn").addEventListener("click", resetPassword);

redirectIfLoggedIn();


