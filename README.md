# Huzaifa Abir — Portfolio & Admin Dashboard

Personal portfolio website with a full admin dashboard.

- **Frontend:** React 19 · Vite 8 · React Router 7 · Tailwind CSS 4 · Firebase Auth (client)
- **Backend:** Node.js · Express 5 · MongoDB Atlas (Mongoose) · Firebase Admin SDK · Firebase Storage
- **Roles:** Super Admin · Admin · Editor

The step-by-step Bangla setup guide is in **SETUP_GUIDE_BN.md**. Read it first.

## Quick start

```bash
# 1. Install everything (root, server, client)
npm run install:all

# 2. Create your env files and fill in your own values (see the guide)
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Run API (port 5000) and website (port 5173) together
npm run dev

# Optional
npm test          # role & access tests (no database needed)
npm run build     # production build of the website -> client/dist
```

## Project layout

```
client/      React website + admin dashboard (Vite)
server/      Express API, MongoDB models, Firebase Storage upload
firebase/    Storage security rules (deploy with Firebase CLI or copy into the console)
```

## Access rules

| Action | Super Admin | Admin | Editor | Visitor |
|---|:-:|:-:|:-:|:-:|
| Edit hero, about, skills, experience, services, projects, images | ✔ | ✔ | ✔ | — |
| Edit contact info, social links, site name, footer | ✔ | ✔ | — | — |
| Read & manage contact messages | ✔ | ✔ | — | — |
| Add / change / remove Admins | ✔ | — | — | — |
| Add / change / remove Editors | ✔ | ✔ | — | — |
| View the website and send a message | ✔ | ✔ | ✔ | ✔ |

Protections:
- The Super Admin (`SUPER_ADMIN_EMAIL`) can never be removed, disabled or demoted.
- Nobody can change their own role or remove their own access.
- The last active administrator can never be removed, disabled or demoted.
- Every rule is enforced on the server. The dashboard hides buttons only for convenience.

## Security notes

- Secrets live only in `server/.env` and `client/.env`. Both are git-ignored.
- The Firebase service-account key is never sent to the browser.
- Uploads are checked by their real file signature (JPG/PNG/WEBP/GIF), max 5 MB, and stored under `portfolio/`.
- Rate limits protect the API and the contact form. Helmet sets security headers.
