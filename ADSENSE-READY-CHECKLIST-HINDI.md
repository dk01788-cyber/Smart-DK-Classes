# Smart DK Classes Website v5.2 — AdSense Readiness

## इस version में तैयार किया गया
- About Us page: `/about.html`
- Contact Us page: `/contact.html`
- Dedicated Privacy Policy: `/privacy-policy.html`
- Terms & Conditions: `/terms.html`
- Legal hub: `/legal.html`
- Original Study Guides page: `/guides.html`
- Footer में About / Contact / Privacy / Terms links
- Support email fallback: `smartdkclasses.help@gmail.com`
- Search-engine robots file: `/robots.txt`
- Service worker cache v5.2
- `ads.txt.template` तैयार

## अभी जानबूझकर नहीं जोड़ा गया
1. **AdSense verification/script** — इसके लिए Google से आपका `ca-pub-...` publisher/client ID चाहिए। Fake ID नहीं डाली गई है।
2. **Live `public/ads.txt`** — publisher ID मिलने पर template की line में ID भरकर `public/ads.txt` बनाना है। Placeholder ads.txt live करना सही नहीं है।
3. **EEA/UK/Switzerland consent CMP** — AdSense चालू करते समय Google-approved CMP/Privacy & messaging setup करें, यदि आपके visitors पर यह requirement लागू होती है।

## Support email database update
अगर deploy के बाद website पर पुराना support email दिखाई दे, Supabase SQL Editor में `supabase/update-support-email.sql` एक बार run करें। यह केवल public support email बदलता है; Admin login email नहीं बदलता।

## AdSense में site add होने के बाद
- Google जो verification method दे, उसी के अनुसार verification code/meta tag लगाएँ।
- `ca-pub-...` ID मिलने पर ads.txt तैयार करें।
- Approval/Ready status से पहले ads placement को final revenue setup न मानें।
- Ads को navigation, download buttons या content controls से misleading तरीके से चिपकाकर न रखें।
