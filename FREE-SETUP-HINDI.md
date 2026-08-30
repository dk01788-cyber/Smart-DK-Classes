# Smart DK Classes V4 — ₹0 Hosting शुरू करने का आसान तरीका

आपको अभी code बदलने की ज्यादा जरूरत नहीं है। केवल accounts/connect करना बाकी है।

## 1) Supabase Free account
1. Supabase पर नया project बनाइए।
2. SQL Editor खोलकर `supabase/schema.sql` पूरा run कीजिए।
3. Storage में `paid-files` नाम का **Private** bucket बनाइए।
4. Project URL और **Publishable Key** copy कीजिए।
5. `public/assets/js/config.js` में इन्हीं दो public values को paste कीजिए।
6. Secret Key browser file में कभी paste न करें।

## 2) अपना Admin account
1. Website के Register page से owner email से account बनाइए।
2. Supabase SQL Editor में `supabase/make-admin.sql` run कीजिए।
3. Login के बाद `/admin.html` खुलेगा।
4. वहीं से product price, vacancies, affiliate links और paid PDF upload कर सकेंगे।

## 3) Cloudflare Free hosting
यह V4 Pages Functions इस्तेमाल करता है, इसलिए GitHub connect करना आसान route है:
1. GitHub पर repository बनाकर V4 folder upload कीजिए।
2. Cloudflare → Workers & Pages → Pages → Connect to Git.
3. Build command खाली रखें।
4. Output directory: `public`
5. Deploy करें।
6. Free `*.pages.dev` address मिलेगा।

## 4) Cloudflare Variables / Secrets
Pages project settings में:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (Secret)
- `YOUTUBE_CHANNEL_ID`

Payment चालू करने के बाद:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET` (Secret)
- `RAZORPAY_WEBHOOK_SECRET` (Secret)

## 5) Razorpay बाद में
Razorpay KYC और QR API access मिलने के बाद webhook URL:
`https://YOUR-SITE.pages.dev/api/razorpay-webhook`

Webhook event:
`qr_code.credited`

## 6) Price बाद में
Model Paper, Book और Paid Course अभी ₹0 starter rows हैं।
Admin Panel से जब चाहें price set कर सकते हैं। ₹0 रहने पर purchase button disabled रहेगा।
