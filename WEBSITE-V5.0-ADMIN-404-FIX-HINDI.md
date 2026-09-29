# Smart DK Classes Website v5.0 — Admin 404 Fix

- Public website अब किसी admin session को `/admin.html` पर redirect नहीं करेगी।
- पुराने bookmark/shortcut से `/admin.html` खुलने पर Cloudflare उसे `/` Home पर redirect करेगा।
- `admin.html` में भी fallback redirect दिया गया है।
- Website पर Admin menu/section hidden/removed ही रहेगा।
- App से content sync जारी रहेगा।
- Service worker cache version बढ़ाया गया है ताकि नया behaviour जल्दी लागू हो।
