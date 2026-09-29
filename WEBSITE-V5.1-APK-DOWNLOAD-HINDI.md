# Smart DK Classes Website v5.1 — APK Download

- Website के ऊपर menu bar के नीचे नया **Smart DK Classes App डाउनलोड करें** strip जोड़ा गया है।
- Strip तभी public users को दिखेगा जब Admin Panel से APK publish किया गया हो।
- `Download APK` latest uploaded APK से अपने-आप जुड़ता है; हर app update पर website redeploy करने की जरूरत नहीं।
- APK file Supabase के `app-downloads` public bucket में रहती है।
- APK path/version `site_settings` में सुरक्षित admin update policy से manage होते हैं।
- Public website पर Admin link वापस नहीं जोड़ा गया है।
- पहले `supabase/apk-download-setup.sql` को Supabase SQL Editor में एक बार run करें।
