# Huzaifa Abir পোর্টফোলিও — সম্পূর্ণ সেটআপ গাইড (বাংলা)

এই গাইডে ধাপে ধাপে বলা আছে কোথায় MongoDB ও Firebase-এর তথ্য বসাতে হবে, কীভাবে চালাতে হবে, এবং কীভাবে ফ্রি-তে অনলাইনে প্রকাশ করতে হবে।

> **জরুরি নিরাপত্তা সতর্কতা:** তোমার আগের Shelter of Hope প্রজেক্টের `.env.example` ফাইলে একটি MongoDB পাসওয়ার্ড সরাসরি লেখা ছিল। সেটি এখন থেকে গোপন নয় বলে ধরে নাও। MongoDB Atlas-এ গিয়ে ওই database user-এর পাসওয়ার্ড **বদলে ফেলো** (Database Access → Edit → Edit Password)। এই প্রজেক্টে কোনো পাসওয়ার্ড বা key লেখা নেই।

---

## ১. কী কী লাগবে

| জিনিস | কেন লাগবে | ফ্রি কি? |
|---|---|---|
| Node.js ২০.১৯ বা তার নতুন | React ও Express চালাতে | হ্যাঁ |
| MongoDB Atlas account | ডেটাবেস (প্রোফাইল, প্রজেক্ট, মেসেজ) | হ্যাঁ, M0 free cluster |
| Firebase project | লগইন (Email/Password) ও ছবি সংরক্ষণ (Storage) | হ্যাঁ, তবে নিচের নোট দেখো |
| Google account | Firebase ও MongoDB-এর জন্য | হ্যাঁ |

**Firebase Storage সম্পর্কে নোট:** নতুন Firebase project-এ Storage চালু করতে Google কখনো কখনো Blaze (pay-as-you-go) plan চাইতে পারে। Blaze plan চালু করলেও ছোট portfolio-র ব্যবহার সাধারণত free quota-র মধ্যেই থাকে। তবু নিরাপদ থাকতে Google Cloud Console → Billing → Budgets থেকে একটি ছোট budget alert (যেমন ১ ডলার) বসিয়ে রাখো। আর Firebase Console-এ Storage-এর usage মাঝে মাঝে দেখে নিও।

---

## ২. প্রজেক্টের কাঠামো

```
huzaifa-abir-portfolio/
├─ client/                 ← ওয়েবসাইট ও অ্যাডমিন ড্যাশবোর্ড (React)
│  ├─ .env.example         ← এখানে Firebase web config বসাবে
│  └─ src/…
├─ server/                 ← API (Express + MongoDB + Firebase)
│  ├─ .env.example         ← এখানে MongoDB ও Firebase Admin তথ্য বসাবে
│  ├─ server.js            ← সার্ভার চালু করার ফাইল
│  ├─ tests/rbac.test.js   ← ভূমিকা ও অনুমতির পরীক্ষা
│  └─ …
├─ firebase/storage.rules  ← Firebase Storage-এর নিরাপত্তা নিয়ম
├─ package.json            ← root scripts (npm run dev, npm run build…)
└─ SETUP_GUIDE_BN.md       ← এই গাইড
```

---

## ৩. MongoDB Atlas সেটআপ (ডেটাবেস)

১. <https://www.mongodb.com/cloud/atlas> → **Sign up** করো। নতুন project বানাও।

২. **Create a cluster** → **M0 (Free)** নির্বাচন করো। Region-এর জন্য কাছের যেকোনো একটি বেছে নাও → **Create**।

৩. **Database Access** (বাঁদিকের মেনু) → **Add New Database User**:
   - Username: যেমন `portfolio_admin`
   - Password: **Autogenerate Secure Password** চাপো, এবং পাসওয়ার্ডটি কোথাও সেভ করে রাখো।
   - Role: **Read and write to any database** → **Add User**।

৪. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) → **Confirm**।
   > ডেভেলপমেন্টের জন্য এটি সুবিধাজনক। প্রোডাকশনে সাধারণত শুধু তোমার সার্ভারের IP রাখা ভালো।

৫. **Database** → তোমার cluster-এর পাশে **Connect** → **Drivers** → Node.js নির্বাচন করো। যে connection string দেখাবে সেটি কপি করো। দেখতে এমন হবে:
   ```
   mongodb+srv://portfolio_admin:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
   ```
   - `<password>` অংশটি তোমার আসল পাসওয়ার্ড দিয়ে বদলাও। যদি পাসওয়ার্ডে `@ : / ? #` বা অন্য বিশেষ চিহ্ন থাকে, তবে সেটি URL-encode করতে হবে (যেমন `@` → `%40`)। সবচেয়ে সহজ উপায় হলো Atlas-এ autogenerate password ব্যবহার করা।
   - শেষে database নাম যোগ করো: `…mongodb.net/huzaifa-portfolio?appName=Cluster0`

---

## ৪. Firebase সেটআপ (লগইন ও ছবি সংরক্ষণ)

### ৪.১ Project তৈরি

১. <https://console.firebase.google.com> → **Add project** → একটি নাম দাও (যেমন `huzaifa-portfolio`)।
২. Google Analytics লাগবে না, বন্ধ রাখতে পারো।

### ৪.২ Email/Password login চালু করা

১. বাঁদিকে **Build → Authentication** → **Get started**।
২. **Sign-in method** ট্যাব → **Email/Password** → **Enable** → **Save**।
   > শুধু Email/Password লাগবে। Google login বা অন্য কিছু দরকার নেই।

### ৪.৩ Web app config (client-এর জন্য)

১. Project Overview-এর পাশে ⚙️ (Settings) → **Project settings** → নিচে **Your apps** → **</>** (Web) আইকন।
২. App nickname: `portfolio-web` → **Register app** (Firebase Hosting টিক দরকার নেই)।
৩. **SDK setup and configuration** → **Config** নির্বাচন করো। এখানে যে মানগুলো দেখাবে সেগুলো লাগবে:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### ৪.৪ Firebase Storage চালু করা (ছবি আপলোডের জন্য)

১. বাঁদিকে **Build → Storage** → **Get started**।
২. Location নির্বাচন করো (যেমন `asia-south1` বা কাছের region)। **Done**।
৩. Storage-এর নিয়ম নিয়ে কিছু করার দরকার নেই। প্রজেক্টে `firebase/storage.rules` ফাইলে সঠিক নিয়ম আছে। চাইলে Firebase CLI দিয়ে deploy করতে পারো (ঐচ্ছিক, নিচে দেখো)।
   - Storage-এর নিয়ম এমনভাবে লেখা: শুধু `portfolio/` ফোল্ডারের ছবি সবাই দেখতে পারবে, কিন্তু browser থেকে কেউ কিছু লিখতে পারবে না। সব আপলোড যায় backend-এর মাধ্যমে।

### ৪.৫ Service account key (server-এর জন্য, অত্যন্ত গোপনীয়)

১. Project settings → **Service accounts** ট্যাব → **Generate new private key** → **Generate key**।
২. একটি JSON ফাইল ডাউনলোড হবে। **এই ফাইল কারও সাথে শেয়ার করবে না, GitHub-এ দেবে না।**
৩. ফাইলটি খুলে দেখো। দুটি উপায়ের যেকোনো একটিতে ব্যবহার করতে পারো (পরের ধাপে বলা আছে)।

### ৪.৬ প্রথম অ্যাডমিন (Super Admin) বানানো

১. Authentication → **Users** ট্যাব → **Add user**।
২. তোমার ইমেইল ও একটি শক্ত পাসওয়ার্ড দাও। এই ইমেইলটিই `SUPER_ADMIN_EMAIL`-এ বসবে।

---

## ৫. কোথায় কী বসাবে (একটি টেবিলে)

### ৫.১ `server/.env` ফাইল (Backend)

প্রথমে `server/.env.example` কপি করে `server/.env` নামে নতুন ফাইল বানাও:

```bash
cd server
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

তারপর `server/.env` খুলে নিচের মানগুলো বসাও:

| Variable | কোথা থেকে পাবে | উদাহরণ |
|---|---|---|
| `PORT` | চাইলে বদলাও, না বদলালে `5000` | `5000` |
| `CLIENT_ORIGIN` | তোমার website-এর ঠিকানা। লোকাল-এ এটি থাকবে | `http://localhost:5173` |
| **`MONGODB_URI`** | ধাপ ৩-এর connection string | `mongodb+srv://portfolio_admin:PASSWORD@cluster0.xxxxx.mongodb.net/huzaifa-portfolio?appName=Cluster0` |
| **`FIREBASE_SERVICE_ACCOUNT_JSON`** | ধাপ ৪.৫-এর JSON ফাইল, পুরো একলাইনে (নিচে দেখো) | `{"type":"service_account",...}` |
| **`FIREBASE_STORAGE_BUCKET`** | Firebase Console → Storage-এর উপরে bucket নাম (যেমন `huzaifa-portfolio.firebasestorage.app`) | `huzaifa-portfolio.firebasestorage.app` |
| **`SUPER_ADMIN_EMAIL`** | ধাপ ৪.৬-এ যে ইমেইল বানিয়েছ | `you@gmail.com` |

**`FIREBASE_SERVICE_ACCOUNT_JSON` কীভাবে বসাবে:** ডাউনলোড করা JSON ফাইলটি খুলে সব লেখা একলাইনে কপি করে `=` চিহ্নের পরে বসাও:
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"…","private_key":"-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n",…}
```
> `private_key`-এর ভেতরের `\n` অংশগুলো যেমন আছে তেমনই রেখে দাও।

**বিকল্প উপায় (Option B):** `FIREBASE_SERVICE_ACCOUNT_JSON` খালি রেখে JSON-এর তিনটি মান আলাদা করে দাও:
```
FIREBASE_PROJECT_ID=…project_id…
FIREBASE_CLIENT_EMAIL=…client_email…
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
```
> `FIREBASE_PRIVATE_KEY`-কে দুই দিকে double quote-এর ভেতরে রাখো।

### ৫.২ `client/.env` ফাইল (Website)

```bash
cd client
cp .env.example .env
```

| Variable | কোথা থেকে পাবে | লোকাল-এ কী দেবে |
|---|---|---|
| `VITE_API_URL` | প্রোডাকশনে backend-এর ঠিকানা (যেমন `https://your-api.onrender.com`) | **খালি রাখো** |
| **`VITE_FIREBASE_API_KEY`** | ধাপ ৪.৩-এর `apiKey` | তোমার মান |
| **`VITE_FIREBASE_AUTH_DOMAIN`** | ধাপ ৪.৩-এর `authDomain` | তোমার মান |
| **`VITE_FIREBASE_PROJECT_ID`** | ধাপ ৪.৩-এর `projectId` | তোমার মান |
| **`VITE_FIREBASE_STORAGE_BUCKET`** | ধাপ ৪.৩-এর `storageBucket` | তোমার মান |
| **`VITE_FIREBASE_MESSAGING_SENDER_ID`** | ধাপ ৪.৩-এর `messagingSenderId` | তোমার মান |
| **`VITE_FIREBASE_APP_ID`** | ধাপ ৪.৩-এর `appId` | তোমার মান |

> `client/.env`-এ কখনো service account key বসাবে না। এখানে শুধু public web config যায়।
> `.env` ফাইল পরিবর্তন করলে dev server বন্ধ করে আবার `npm run dev` চালাতে হবে।

---

## ৬. চালানো (Local)

প্রথমবার, প্রজেক্টের root ফোল্ডারে:

```bash
npm run install:all      # root, server ও client সব dependency একবারে
```

তারপর:

```bash
npm run dev              # API (port 5000) ও Website (port 5173) একসাথে চলবে
```

### প্রথম অ্যাডমিন সক্রিয় করা

server চালু হলে terminal-এ `Super Admin ready: তোমার@ইমেইল` লেখা দেখলে সব ঠিক আছে।

- যদি `No Firebase user found` লেখা আসে: ধাপ ৪.৬ অনুযায়ী Firebase-এ ইমেইলটি বানাও, তারপর server আবার চালু করো।
- ম্যানুয়ালি চালাতে চাইলে: `npm run seed:admin`

### যাচাই করা

১. Browser-এ `http://localhost:5000/api/health` খোলো। দেখতে হবে:
   ```json
   { "ok": true, "database": "connected", "firebaseConfigured": true }
   ```
   - `database: "disconnected"` হলে `MONGODB_URI` ভুল।
   - `firebaseConfigured: false` হলে Firebase তথ্য বা `FIREBASE_STORAGE_BUCKET` ঠিক নেই।
২. `http://localhost:5173` — ওয়েবসাইট দেখা যাবে।
৩. `http://localhost:5173/admin/login` — তোমার Super Admin ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করো।
৪. Dashboard → **Profile & contact** → তোমার photo আপলোড করো → **Save section**।

### পরীক্ষা চালানো (ঐচ্ছিক)

```bash
npm test
```
২৪টি ভূমিকা-অনুমতির পরীক্ষা চলবে। এগুলো MongoDB বা Firebase ছাড়াই চলে।

---

## ৭. ড্যাশবোর্ডে কী কী করা যায়

| মেনু | কী করা যায় | কে পারে |
|---|---|---|
| **Dashboard** | সংখ্যা, নতুন মেসেজ, দ্রুত লিংক | Editor+ |
| **Profile & contact** | Hero (ছবি, নাম, পদবি, বাটন), About, Site নাম ও footer, যোগাযোগের তথ্য, Social লিংক | Hero/About: Editor+ · বাকি: Admin+ |
| **Skills & experience** | Skill (লেভেলসহ), Experience, Services | Editor+ |
| **Projects** | নতুন প্রজেক্ট, সম্পাদনা, মুছে ফেলা, ছবি আপলোড (আগে preview দেখায়), Published/Draft, Featured, ক্রম | Editor+ |
| **Messages** | Contact form-এর মেসেজ পড়া, Read/Unread, Reply, মুছে ফেলা | Admin+ |
| **Users & access** | Staff যোগ, ভূমিকা বদলানো, Disable/Enable, Remove | Admin+ (Admin শুধু Editor নিয়ন্ত্রণ করতে পারে) |
| **My account** | নিজের নাম বদলানো, password reset ইমেইল | সবাই |

### ভূমিকা ও নিয়ম

- **Super Admin:** সবকিছু। Admin ও Editor যোগ/বদলানো/সরানো যায়। নিজের Super Admin অ্যাকাউন্ট কেউ সরাতে বা বন্ধ করতে পারে না।
- **Admin:** ওয়েবসাইটের সব content ও settings। Editor যোগ/বদলানো/সরানো যায়। অন্য Admin বা Super Admin-কে বদলানো যায় না।
- **Editor:** প্রোফাইলের Hero/About, skills, experience, services, projects ও ছবি। যোগাযোগের তথ্য, Social, Messages ও Users-এ প্রবেশ নেই।
- **শেষ সক্রিয় administrator** কখনো সরানো, বন্ধ বা অবনমিত করা যায় না।
- কেউ নিজের ভূমিকা নিজে বদলাতে বা নিজেকে সরাতে পারে না।
- নতুন staff যোগ করলে Firebase-এ অ্যাকাউন্ট না থাকলে তৈরি হয় এবং একটি **একবারের password setup link** দেখানো হয়। সেই লিংকটি নতুন ব্যক্তিকে পাঠাও। লিংকটি আর দেখা যাবে না, তাই কপি করে রাখো।

---

## ৮. অনলাইনে প্রকাশ করা (ফ্রি)

### ধাপ A: Backend (Render, ফ্রি Web Service)

১. <https://render.com> → GitHub দিয়ে login → **New → Web Service**।
২. প্রজেক্টটি GitHub repository-তে রাখো। Repository-র root-এ `server` ফোল্ডার থাকবে।
৩. সেটিংস:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node version:** Environment-এ `NODE_VERSION` = `20` বা তার উপরে
4. **Environment** ট্যাবে `server/.env`-এর সব মান একে একে যোগ করো (`PORT` বাদে)। আর `CLIENT_ORIGIN`-এ তোমার frontend-এর ঠিকানা দাও (ধাপ B শেষে জানা যাবে)।
   - `FIREBASE_SERVICE_ACCOUNT_JSON` খুব বড় হতে পারে। সেটি একই লাইনে পেস্ট করো।
5. Deploy শেষে `https://তোমার-api.onrender.com/api/health` খুলে যাচাই করো।

> Render-এর ফ্রি plan কিছুক্ষণ ব্যবহার না হলে ঘুমিয়ে যায়। প্রথম request-এ ৩০–৬০ সেকেন্ড লাগতে পারে। এটি স্বাভাবিক।

### ধাপ B: Frontend (Netlify বা Vercel, ফ্রি)

**Netlify (সহজ):**
১. <https://app.netlify.com> → **Add new site → Import an existing project** → GitHub repository।
২. সেটিংস (Root directory খালি রাখো, অর্থাৎ repository-র root থেকে):
   - **Build command:** `npm --prefix client install && npm --prefix client run build`
   - **Publish directory:** `client/dist`
3. **Environment variables**-এ `client/.env`-এর সব `VITE_*` মান যোগ করো। `VITE_API_URL`-এ ধাপ A-এর Render ঠিকানা দাও (শেষে `/` দিও না)।
4. Deploy করো। পেয়ে যাওয়া `https://xxx.netlify.app` ঠিকানাটি নিচের দুই জায়গায় বসাও:
   - Render → `CLIENT_ORIGIN` = এই ঠিকানা (শেষে `/` নয়)
   - Firebase → Authentication → Settings → **Authorized domains** → এই host (যেমন `xxx.netlify.app`) যোগ করো
5. Render service-টি আবার deploy করো (Environment পরিবর্তনের পর)।

> `/admin/projects` সরাসরি খুললে 404 যাতে না আসে, তার জন্য প্রজেক্টে `client/public/_redirects` ফাইল আগে থেকেই আছে। Netlify এটি নিজে পড়ে নেয়।

**Vercel:** Root directory `client`, Framework preset **Vite**, এবং একই environment variables। Vercel-এ `client/public/_redirects` ব্যবহার হয় না, তাই এখানে `vercel.json` যোগ করো: `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}` (ফাইলটি `client/` ফোল্ডারে)।



### ধাপ C: Firebase Storage rules (ঐচ্ছিক)

Firebase CLI দিয়ে:
```bash
npm install -g firebase-tools
firebase login
firebase use --add            # তোমার project নির্বাচন করো
firebase deploy --only storage
```

---

## ৯. সমস্যা সমাধান

| সমস্যা | কারণ ও সমাধান |
|---|---|
| Server চালু হয় না, `MongoDB connection failed` | `MONGODB_URI` ভুল, password-এ বিশেষ চিহ্ন URL-encode করা হয়নি, অথবা Network Access-এ IP অনুমোদিত নয় |
| Server চালু হয় না, `FIREBASE`-সংক্রান্ত লেখা | `FIREBASE_SERVICE_ACCOUNT_JSON` অসম্পূর্ণ বা ভুল JSON। একলাইনে সব কপি হয়েছে কি না দেখো |
| `/api/health`-এ `firebaseConfigured: false` | `FIREBASE_STORAGE_BUCKET` খালি, অথবা credentials নেই |
| লগইন করলে "Firebase is not configured" | `client/.env`-এর `VITE_FIREBASE_*` মান খালি। `.env` বদলালে dev server পুনরায় চালু করো |
| লগইন হয় কিন্তু "This account does not have admin access" | ইমেইলটি staff হিসেবে যোগ হয়নি। Super Admin ইমেইল হলে server restart করো |
| ছবি আপলোড হয় না, "File storage is not configured" | `FIREBASE_STORAGE_BUCKET` ও Storage চালু আছে কি না দেখো |
| Upload-এ `Only JPG, PNG, WEBP or GIF` | অন্য ফরম্যাট বা নাম বদলানো ফাইল। প্রকৃত ছবি ফাইল নির্বাচন করো |
| "The image is larger than 5 MB" | ছবি সংকুচিত করো (যেমন squoosh.app) |
| Browser-এ CORS error | `CLIENT_ORIGIN`-এ frontend-এর সঠিক ঠিকানা নেই (প্রোটোকল, port সহ) |
| Render-এ প্রথম request ধীর | ফ্রি plan-এর ঘুম থেকে জাগা। স্বাভাবিক |
| `npm run dev` দুটি server একসাথে চালালে port ব্যস্ত | অন্য কোনো চালু process বন্ধ করো |

---

## ১০. নিরাপত্তা চেকলিস্ট

- [ ] পুরনো Shelter of Hope-এর MongoDB পাসওয়ার্ড বদলেছ
- [ ] `server/.env`, `client/.env` ও service account JSON কোথাও শেয়ার বা commit করোনি
- [ ] Super Admin-এর পাসওয়ার্ড শক্ত, এবং 2-step verification (Google account) চালু
- [ ] Firebase Authentication → Authorized domains-এ শুধু তোমার domain ও localhost আছে
- [ ] Atlas Network Access শেষে প্রোডাকশনের জন্য সীমিত করেছ
- [ ] Budget alert বসানো আছে (Firebase/Google Cloud)

---

## ১১. ছবি ও লেখা পরিবর্তন

- ওয়েবসাইটে যা কিছু দেখা যাচ্ছে (নাম, পদবি, bio, skills, experience, services, প্রজেক্ট, ছবি, যোগাযোগ) সবই ড্যাশবোর্ড থেকে বদলানো যায়।
- প্রথম দিকের লেখাগুলো (bio, skills, services) নমুনা। তোমার নিজের তথ্য দিয়ে বদলে নিও।
- যোগাযোগের ফোন, ইমেইল, WhatsApp ইত্যাদি খালি আছে। নিজে পূরণ না করলে তা ওয়েবসাইটে দেখাবে না।
