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

async function redirectIfLoggedIn() {
  const { data } = await supabase.auth.getSession();
  if (data?.session) window.location.href = `${SITE}/accueil.html`;
}

async function signup() {
  setMsg("Création du compte...");
  const email = $("email").value.trim();
  const password = $("password").value;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE}/accueil.html` },
  });

  if (error) return setMsg(error.message, true);
  setMsg("Compte créé. Vérifie tes emails si la confirmation est activée.");
}

async function login() {
  setMsg("Connexion...");
  const email = $("email").value.trim();
  const password = $("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return setMsg(error.message, true);

  if (data?.session) window.location.href = `${SITE}/accueil.html`;
  else setMsg("Connexion non établie. Réessaie.", true);
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

