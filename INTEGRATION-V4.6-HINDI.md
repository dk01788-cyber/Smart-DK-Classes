# Smart DK Classes Website V4.6 — App Theme Integration

## क्या integrate हुआ
- Website homepage अब Android app की blue-white design language में है।
- Class 9, 10, 11, 12 cards और Quick Access sections जोड़े गए हैं।
- Latest PDFs/Study Material `public.app_content` से आता है।
- Website केवल वही shared content पढ़ती है जिसका `display_target` `website` या `both` है।
- Homepage पर केवल `show_on_home = true` content default रूप से दिखता है।
- Class/Type filter और header search all Website/Both content में खोजते हैं, सिर्फ Home-featured content में नहीं।
- PDF/file link `public-content` Supabase storage bucket से बनता है।
- Existing Store, Payment, Login, Vacancy, Videos और other pages delete नहीं किए गए हैं।

## Supabase browser configuration
`public/assets/js/config.js` में public Supabase URL और publishable key configured हैं। कोई `service_role` / secret key browser code में नहीं है।

## Deploy
Cloudflare Pages पर existing V4 setup की तरह output directory `public` रखें।


## App Admin → Website live sync update
- Android Admin Panel और Website अब उसी Supabase `app_content` table को source-of-truth मानते हैं।
- Admin Panel में `App + Website (Both)` चुनने पर वही item App और Website दोनों में उपलब्ध होगा।
- `Website Only` Website पर और `App Only` केवल Android app में रहेगा।
- Website खुले रहने पर shared content हर लगभग 30 सेकंड में change check करता है; change मिलते ही page refresh होकर नया content दिखाता है।
- Cloudflare Pages URL config: `https://smart-dk-classes-web.pages.dev`
- App login/authentication flow में कोई बदलाव नहीं किया गया है।
