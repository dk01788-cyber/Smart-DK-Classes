# What still requires your accounts / action

The code is ready, but these credentials cannot be created safely from a public YouTube channel or guessed by code.

## Required for login/database
- Create free Supabase account/project
- Paste `supabase/schema.sql`
- Create PRIVATE Storage bucket: `paid-files`
- Provide Project URL + Publishable key in `public/assets/js/config.js`
- Put Supabase Secret key only in Cloudflare secret variables
- Register owner account and run `supabase/make-admin.sql`

## Required to put the website online for ₹0 hosting
- Create/login to Cloudflare account
- Connect a GitHub repository (or use Wrangler)
- Deploy with output directory `public`
- Free `*.pages.dev` URL will be assigned

## Required only when taking real payments
- Razorpay merchant account / KYC
- QR Codes API access
- Razorpay Key ID
- Razorpay Key Secret
- Webhook Secret
- Set webhook event `qr_code.credited`

## Content you can add later from Admin
- Product prices
- Model Paper PDFs
- Books
- Paid course details/files
- Vacancy notices
- Amazon / Flipkart affiliate links
