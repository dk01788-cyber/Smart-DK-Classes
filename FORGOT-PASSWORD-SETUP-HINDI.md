# Smart DK Classes — Forgot Password Setup

यह update Login page पर **Forgot Password?** जोड़ता है और दो नए pages देता है:

- `/forgot-password.html`
- `/reset-password.html`

## 1) Supabase में Redirect URL जोड़ें

Supabase Dashboard → **Authentication → URL Configuration** खोलें।

**Site URL** में रखें:

`https://smart-dk-classes-web.pages.dev`

**Redirect URLs** में यह exact URL जोड़ें:

`https://smart-dk-classes-web.pages.dev/reset-password.html`

अगर बाद में custom domain लें, उसके `reset-password.html` URL को भी allowlist में जोड़ें।

## 2) config.js check करें

`public/assets/js/config.js` में `siteUrl` होना चाहिए:

```js
siteUrl: "https://smart-dk-classes-web.pages.dev"
```

`SUPABASE_SECRET_KEY` को कभी भी `config.js` में न डालें।

## 3) Deploy

GitHub project folder में PowerShell खोलकर:

```powershell
npx.cmd wrangler pages deploy public --project-name smart-dk-classes-web --branch main
```

## 4) Test

1. `/login.html` खोलें।
2. **Forgot Password?** दबाएँ।
3. Registered email डालें।
4. Email में reset link खोलें।
5. नया password दो बार डालकर Update Password करें।
6. Login page पर नए password से login करें।

Reset email न दिखे तो Spam/Junk folder भी देखें।
