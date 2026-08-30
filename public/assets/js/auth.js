document.addEventListener("DOMContentLoaded", () => {
  const sdk = window.smartdk;
  const login = document.getElementById("login-form");
  const register = document.getElementById("register-form");

  if (new URLSearchParams(location.search).get("setup")==="1") {
    const box = document.getElementById("login-msg");
    box?.replaceChildren(sdk.notice("Supabase setup के बाद login चालू होगा। README में 10-minute setup दिया है।"));
  }

  login?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("login-msg");
    try {
      const { error } = await sdk.login({email:document.getElementById("login-email").value.trim(), password:document.getElementById("login-password").value});
      if (error) throw error;
      const next = new URLSearchParams(location.search).get("next") || "/dashboard.html";
      location.href = next;
    } catch (err) {
      msg.replaceChildren(sdk.notice(err.message || "Login failed", "error"));
    }
  });

  register?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("register-msg");
    try {
      const { data, error } = await sdk.signup({
        fullName: document.getElementById("reg-name").value.trim(),
        phone: document.getElementById("reg-phone").value.trim(),
        email: document.getElementById("reg-email").value.trim(),
        password: document.getElementById("reg-password").value
      });
      if (error) throw error;
      if (data.session) location.href = "/dashboard.html";
      else msg.replaceChildren(sdk.notice("Account created. Email confirmation enabled है तो inbox में confirmation link खोलें।", "success"));
    } catch (err) {
      msg.replaceChildren(sdk.notice(err.message || "Registration failed", "error"));
    }
  });
});
