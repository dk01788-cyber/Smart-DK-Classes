# Smart DK Classes Platform V4 — Free Hosting Edition

This version is converted from the Node/SQLite starter to a **Cloudflare Pages Functions + Supabase** architecture so the platform can start on free tiers.

## What is included

- Responsive Smart DK Classes branded website
- Student registration/login with Supabase Auth
- Books, Model Papers, Super Notes and Paid Courses
- Prices editable later from Admin Panel
- Jobs / Vacancy Center
- Amazon / Flipkart affiliate recommendation section
- YouTube public uploads feed without a YouTube API key
- Dynamic fixed-amount UPI QR integration code for Razorpay
- Payment status verification + `qr_code.credited` webhook
- Purchase unlock after verified payment
- Physical book delivery address captured before payment
- Private paid PDF/ZIP bucket with purchase-based access
- Student dashboard + paid downloads
- Doubt support
- Admin product, price, vacancy and affiliate management
- Contact/email/YouTube settings editable from Admin Panel
- Smart DK Wallet/Balance ledger (payment/settlement tracking; not a regulated stored-value wallet)

## Architecture

- **Static website:** Cloudflare Pages
- **Serverless backend:** Cloudflare Pages Functions (`/functions/api`)
- **Auth + Database + private file storage:** Supabase
- **Payment:** Razorpay QR API (when your merchant account/feature is ready)
- **YouTube:** public channel RSS via a Cloudflare Function

Only `/api/*` invokes Pages Functions. Static files stay static via `public/_routes.json`.

## A. Supabase setup

1. Create a free Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Open **Storage** and create a bucket named exactly `paid-files`.
4. Keep `paid-files` **PRIVATE**.
5. In Project settings / Connect, copy:
   - Project URL
   - Publishable key (`sb_publishable_...`)
   - Secret key (`sb_secret_...`) — SERVER ONLY
6. Edit `public/assets/js/config.js` and paste ONLY:
   - Project URL
   - Publishable key
7. Never put `sb_secret_...` in `config.js`, HTML, GitHub public code, WhatsApp/chat, or any browser file.

### Make your first account Admin

1. Register the owner email from the website, or create the user in Supabase Auth.
2. Run `supabase/make-admin.sql` in SQL Editor.
3. Login again and open `/admin.html`.

## B. Cloudflare Pages deployment

Because this project uses **Pages Functions**, deploy through a connected Git repository or Wrangler. Do not rely on a static-only drag/drop upload for the Functions.

### Easiest repeatable route
1. Create a GitHub repository and upload this project.
2. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
3. Framework preset: None.
4. Build command: leave empty.
5. Build output directory: `public`.
6. Deploy.

Cloudflare will give a free `*.pages.dev` address.

### Cloudflare Variables and Secrets

In your Pages project add these runtime variables:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (secret)
- `YOUTUBE_CHANNEL_ID`

After Razorpay setup, also add:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET` (secret)
- `RAZORPAY_WEBHOOK_SECRET` (secret)

## C. Razorpay Dynamic QR

The code creates a **single-use, fixed-amount UPI QR**. The amount is read server-side from the `products` table, so the browser cannot simply send a cheaper amount.

After your Razorpay account/KYC and QR Codes API access are ready:

1. Put test credentials in Cloudflare Variables and Secrets.
2. Set webhook URL:
   `https://YOUR-SITE.pages.dev/api/razorpay-webhook`
3. Enable the QR webhook event:
   `qr_code.credited`
4. Test with test-supported flow first, then switch to live keys.

The product unlock flow is:

`Login → product → create exact QR → pay → provider verification/webhook → payments=paid → purchase created → paid file/course access`

## D. Uploading paid PDFs

1. Login as Admin.
2. Open `/admin.html`.
3. Select product under **Upload Paid PDF / ZIP**.
4. Upload PDF/ZIP.
5. File goes to the private `paid-files` bucket under:
   `PRODUCT_UUID/filename.pdf`
6. Storage RLS allows authenticated buyers to download only files for products they have purchased.

## E. Price can be set later

Starter Model Paper / Book / Paid Course are inserted with `price = 0`.

When price is 0:
- product remains visible
- purchase button stays disabled

Set ₹49 / ₹99 / ₹499 / any desired price later from Admin Panel.

## F. Wallet note

“Smart DK Wallet / Balance” is a dashboard ledger:
- Gross paid
- Refunds
- Recorded bank settlements
- Estimated available amount

It does **not** create an RBI-regulated wallet and does not implement arbitrary bank-account transfers.

## Security before launch

- Keep Supabase Secret Key only in Cloudflare secrets.
- Keep Razorpay Secret/Webhook Secret only in Cloudflare secrets.
- Do not create a public paid-files bucket.
- Keep RLS enabled.
- Test a normal student account cannot open `/admin.html` or another buyer's paid file.
- Add final Privacy / Terms / Refund / Shipping policies.
- Publish vacancy information only after official-source verification.
- Use only approved affiliate links and required disclosures.
- For expensive paid video courses, use a protected video streaming provider rather than public/unlisted links.

## Local preview

The easiest visual preview is `preview.html`.

For full Pages Functions locally:

```bash
npm install
cp .dev.vars.example .dev.vars
npm run dev
```

Then open the local URL Wrangler prints.

## Files to edit first

1. `public/assets/js/config.js` — Supabase public config
2. `supabase/schema.sql` — run once
3. `supabase/make-admin.sql` — run after owner signup
4. Cloudflare project Variables/Secrets — server secrets
5. Admin Panel — prices/products/vacancies/files
