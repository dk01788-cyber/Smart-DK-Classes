# Smart DK Classes Website v4.9 — Changes

1. Android app का current `banner.png` website पर same asset के रूप में लगाया गया है।
2. Header में brand/logo बाईं तरफ और Search box दाईं तरफ रखा गया है।
3. Menu bar को header के ठीक नीचे और banner के ठीक ऊपर अलग line में रखा गया है।
4. Public menu से Admin हटाया गया है। Footer से भी Admin Panel link हटाया गया है। Direct `/admin.html` route सुरक्षित रखा गया है ताकि backend/app workflow न टूटे।
5. Home से `ONE ADMIN PANEL / App + Website Connected` card हटाया गया है।
6. Mobile, tablet, laptop के लिए responsive header, search, menu और banner rules जोड़े गए हैं।
7. PDFs के लिए नया responsive `pdf-viewer.html` जोड़ा गया है: Prev/Next, Zoom और Download के साथ।
8. PWA orientation `any` किया गया है।
9. Service Worker cache version bump किया गया है ताकि पुराने banner/CSS/JS cache से समस्या न हो।
