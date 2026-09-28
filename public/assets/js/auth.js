document.addEventListener("DOMContentLoaded", () => {
  const sdk = window.smartdk;
  const login = document.getElementById("login-form");
  const register = document.getElementById("register-form");
  const forgotPassword = document.getElementById("forgot-password-form");
  const resetPassword = document.getElementById("reset-password-form");

  const setButtonBusy = (form, busy, busyText = "Please wait...") => {
    const btn = form?.querySelector('button[type="submit"]');
    if (!btn) return;
    if (busy) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = busyText;
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.disabled = false;
    }
  };

  if (new URLSearchParams(location.search).get("setup") === "1") {
    const box = document.getElementById("login-msg");
    box?.replaceChildren(sdk.notice("Supabase setup के बाद login चालू होगा। README में setup दिया है।"));
  }

  login?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("login-msg");
    setButtonBusy(login, true, "Logging in...");
    try {
      const { error } = await sdk.login({
        email: document.getElementById("login-email").value.trim(),
        password: document.getElementById("login-password").value
      });
      if (error) throw error;
      const profile = await sdk.getProfile();
      if (profile?.is_admin) {
        location.replace('/admin.html');
        return;
      }
      const requested = new URLSearchParams(location.search).get("next");
      const blockedForStudents = new Set(['/admin.html', '/wallet.html']);
      const next = requested && !blockedForStudents.has(requested.split('?')[0]) ? requested : '/dashboard.html';
      location.replace(next);
    } catch (err) {
      msg.replaceChildren(sdk.notice(err.message || "Login failed", "error"));
    } finally {
      setButtonBusy(login, false);
    }
  });

  register?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("register-msg");
    setButtonBusy(register, true, "Creating account...");
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
    } finally {
      setButtonBusy(register, false);
    }
  });

  forgotPassword?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = document.getElementById("forgot-password-msg");
    const email = document.getElementById("forgot-email").value.trim();
    setButtonBusy(forgotPassword, true, "Sending...");
    try {
      const { error } = await sdk.sendPasswordReset(email);
      if (error) throw error;
      msg.replaceChildren(sdk.notice("अगर यह email registered है, password reset link भेज दिया गया है। Inbox के साथ Spam/Junk भी check करें।", "success"));
      forgotPassword.reset();
    } catch (err) {
      msg.replaceChildren(sdk.notice(err.message || "Reset link भेजने में दिक्कत हुई।", "error"));
    } finally {
      setButtonBusy(forgotPassword, false);
    }
  });

  if (resetPassword) {
    const msg = document.getElementById("reset-password-msg");
    const sb = sdk.getClient();

    if (!sb) {
      msg.replaceChildren(sdk.notice("Supabase setup complete नहीं है।", "error"));
      const btn = resetPassword.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
    } else {
      let recoveryReady = false;

      const markReady = () => {
        recoveryReady = true;
        msg.replaceChildren(sdk.notice("Reset link verified. अब नया password सेट करें।", "success"));
      };

      sb.auth.getSession().then(({ data }) => {
        if (data?.session) markReady();
        else msg.replaceChildren(sdk.notice("Reset link verify हो रहा है। अगर यह message बना रहे, email का नया reset link खोलें।"));
      }).catch(() => {
        msg.replaceChildren(sdk.notice("Reset link verify नहीं हो पाया। नया reset link भेजें।", "error"));
      });

      sb.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) markReady();
      });

      resetPassword.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("new-password").value;
        const confirm = document.getElementById("confirm-password").value;

        if (password.length < 8) {
          msg.replaceChildren(sdk.notice("Password कम-से-कम 8 characters का रखें।", "error"));
          return;
        }
        if (password !== confirm) {
          msg.replaceChildren(sdk.notice("दोनों passwords एक जैसे नहीं हैं।", "error"));
          return;
        }
        if (!recoveryReady) {
          msg.replaceChildren(sdk.notice("Reset link valid session नहीं मिला। Email से नया reset link खोलें।", "error"));
          return;
        }

        setButtonBusy(resetPassword, true, "Updating...");
        try {
          const { error } = await sdk.updatePassword(password);
          if (error) throw error;
          await sb.auth.signOut();
          msg.replaceChildren(sdk.notice("Password successfully बदल गया। अब नए password से Login करें।", "success"));
          resetPassword.reset();
          setTimeout(() => { location.href = "/login.html?password=updated"; }, 1200);
        } catch (err) {
          msg.replaceChildren(sdk.notice(err.message || "Password update नहीं हो पाया।", "error"));
          setButtonBusy(resetPassword, false);
        }
      });
    }
  }

  if (new URLSearchParams(location.search).get("password") === "updated") {
    const box = document.getElementById("login-msg");
    box?.replaceChildren(sdk.notice("Password बदल गया है। अब नए password से Login करें।", "success"));
  }
});
