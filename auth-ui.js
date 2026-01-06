import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://wjanwfxbtgvxjgohlliu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqYW53ZnhidGd2eGpnb2hsbGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzM0MTIsImV4cCI6MjA4MjkwOTQxMn0.3GHwxMSKd1RYagskXzU6QyyVxoJJsfxZV5QeOVmweBk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function applyAuthUI(user) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (loginBtn) loginBtn.hidden = !!user;
  if (logoutBtn) logoutBtn.hidden = !user;

  if (user && logoutBtn) {
    logoutBtn.onclick = async (e) => {
      e.preventDefault?.();
      await supabase.auth.signOut();
      window.location.reload();
    };
  }
}

export async function setupAuthUI() {
  const { data, error } = await supabase.auth.getSession();
  const user = error ? null : (data?.session?.user ?? null);
  applyAuthUI(user);

  supabase.auth.onAuthStateChange((_event, session) => {
    applyAuthUI(session?.user ?? null);
  });

  return user;
}
