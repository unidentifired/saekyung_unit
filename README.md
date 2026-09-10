# Saekyung Staycation — Rental Condo Website

A static site (HTML + Tailwind + vanilla JS) for showcasing two condo units,
with Google-authenticated reviews, live availability, and a small rule-based
chatbot. Reviews and availability are backed by Firebase (Auth + Firestore).

## Files

```
index.html            All page markup and sections
css/style.css          Design tokens + component styles
js/firebase-config.js  Firebase init — put your config + owner emails here
js/auth.js             Google sign-in / sign-out, owner detection
js/availability.js     Live unit status, owner "flip status / set price" panel
js/reviews.js          Review submission, public feed, star summary, moderation queue
js/chatbot.js          Rule-based chat widget (no external API, no cost)
js/main.js             Nav scroll state, mobile menu, footer year
```

## 1. Create a Firebase project (free tier is enough)

1. Go to https://console.firebase.google.com → **Add project**.
2. Once created, click the **`</>`** (web) icon to register a web app.
3. Copy the `firebaseConfig` object it gives you.
4. Paste it into `js/firebase-config.js`, replacing the placeholder values.

## 2. Turn on Google sign-in

Firebase Console → **Build → Authentication → Sign-in method → Google → Enable**.
Add your own email as a test user if the project is still in testing mode.

## 3. Create Firestore

Firebase Console → **Build → Firestore Database → Create database** (production
mode is fine — the rules below lock it down properly).

You don't need to pre-create documents; the app creates `units/unit-a` and
`units/unit-b` automatically the first time the owner sets a status or price.

## 4. Set who the "owner" is

In `js/firebase-config.js`:

```js
export const OWNER_EMAILS = [
  "you@gmail.com",
];
```

Whoever signs in with one of these Google accounts sees the owner controls
(flip availability, set price, approve/remove reviews). Everyone else only
sees the public site.

## 5. Firestore security rules

Firebase Console → **Firestore Database → Rules**, replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Anyone can read approved reviews; only the signed-in author can create
    // their own review (starts unapproved); only the owner can edit/approve/delete.
    match /reviews/{reviewId} {
      allow read: if resource.data.approved == true
                  || (request.auth != null && request.auth.uid == resource.data.uid)
                  || isOwner();
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.approved == false;
      allow update, delete: if isOwner();
    }

    // Anyone can read unit status; only the owner can write it.
    match /units/{unitId} {
      allow read: if true;
      allow write: if isOwner();
    }

    function isOwner() {
      return request.auth != null &&
        request.auth.token.email in [
          "you@gmail.com"
        ];
    }
  }
}
```

Replace `"you@gmail.com"` in the rules with the same address(es) you put in
`OWNER_EMAILS` — the JS list controls the UI, the rules control who can
actually write data, and they need to match.

## 6. Run it locally

Because the JS uses ES modules (`type="module"`), open it through a local
server rather than double-clicking the file:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then visit the printed local URL.

## 7. Deploy

Any static host works — Firebase Hosting, Netlify, Vercel, GitHub Pages.
For Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # point the public directory at this folder
firebase deploy
```

## Customizing

- **Copy & pricing**: edit the text directly in `index.html` (unit
  descriptions, contact details, footer).
- **Owner contact**: update the `mailto:` / `tel:` links in the footer.
- **Chatbot answers**: `js/chatbot.js` → `getBotReply()` is a set of keyword
  patterns; add more `if (/pattern/.test(t))` blocks for new topics.
- **Colors/fonts**: CSS variables live at the top of `css/style.css` and in
  the `tailwind.config` block in `index.html`.
