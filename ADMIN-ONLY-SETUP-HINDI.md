# Smart DK Classes — Admin Only Login Patch

यह patch role separation लागू करता है:

- `dk01788@gmail.com` का profile admin होने पर Login के बाद सीधे `/admin.html` खुलेगा।
- Admin login रहते हुए public/student pages खोलने पर वापस Admin Panel पर redirect होगा।
- Student login के बाद `/dashboard.html` खुलेगा।
- Student Dashboard में Admin Panel link बिल्कुल नहीं रहेगा।
- Student अगर direct `/admin.html` या `/wallet.html` खोले, तो उसे Dashboard पर redirect किया जाएगा।
- Admin header में सिर्फ `Admin Panel`, `Wallet / Balance` और `Logout` दिखेंगे।
- सुरक्षा सिर्फ frontend पर नहीं है; Supabase RLS का `is_admin()` check भी single admin email से lock किया जा सकता है।

## Apply
1. इस patch के `public` folder को अपने `Smart-DK-Classes` project root में copy/replace करें।
2. `supabase/enforce-single-admin.sql` को Supabase SQL Editor में **एक बार** Run करें।
3. PowerShell में project root से deploy करें:

```powershell
npx.cmd wrangler pages deploy public --project-name smart-dk-classes-web --branch main
```

4. Browser में logout करके test करें:
   - `dk01788@gmail.com` → Admin Panel
   - कोई student email → Student Dashboard, Admin option नहीं

