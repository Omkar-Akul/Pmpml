# AlandiBus – Pune PMPML Bus Finder

A static web app to search PMPML bus routes between stops in the Alandi area of Pune, Maharashtra.

---

## Live Site

Deployed on **GitHub Pages**: `https://<your-github-username>.github.io/Pmpml/`

---

## Project Structure

```
├── index.html            Main HTML page
├── style.css             Styles
├── script.js             App logic
├── data.js               Route & stop data
├── firebase-config.js    Firebase initialisation (credentials injected at deploy time)
├── .env.example          Template – copy and fill in for local development
├── .gitignore
└── .github/
    └── workflows/
        └── deploy.yml    GitHub Actions workflow – injects secrets and deploys to Pages
```

---

## Firebase Configuration

Firebase credentials are **not stored in the repository**. The file
`firebase-config.js` contains placeholder strings (`__FIREBASE_API_KEY__` etc.)
that are replaced with real values by the GitHub Actions deployment workflow
using [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

> **Note on key rotation:** The previously committed API key should be considered
> exposed. It is strongly recommended to rotate it in the Firebase Console
> (**Project Settings → General → Web API Key**) and review your
> [Firebase Security Rules](https://console.firebase.google.com/project/_/firestore/rules)
> to ensure they restrict reads/writes appropriately.

---

## Deployment Setup (GitHub Pages via GitHub Actions)

### 1 – Add GitHub Secrets

In your repository, go to **Settings → Secrets and variables → Actions → New repository secret**
and add each of the following secrets with the corresponding value from
**Firebase Console → Project Settings → Your apps → Web app**:

| Secret name                    | Description                        |
|--------------------------------|------------------------------------|
| `FIREBASE_API_KEY`             | Web API key                        |
| `FIREBASE_AUTH_DOMAIN`         | `<project-id>.firebaseapp.com`     |
| `FIREBASE_PROJECT_ID`          | Firebase project ID                |
| `FIREBASE_STORAGE_BUCKET`      | `<project-id>.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID          |
| `FIREBASE_APP_ID`              | Web app ID                         |
| `FIREBASE_MEASUREMENT_ID`      | Google Analytics measurement ID    |

### 2 – Switch GitHub Pages source to GitHub Actions

1. Go to **Settings → Pages** in your repository.
2. Under **Build and deployment → Source**, select **GitHub Actions** (instead of *Deploy from a branch*).
3. Save.

### 3 – Trigger a deployment

Push a commit to `main` or go to **Actions → Deploy to GitHub Pages → Run workflow**.
The workflow will inject your secrets into `firebase-config.js` at build time and
publish the site.

---

## Local Development

Because `firebase-config.js` in the repository contains only placeholders, you need
to replace those values locally before the Firebase features (login, booking) will work.

1. **Copy the example file** to the same directory:

   ```bash
   cp .env.example .env
   # Fill in your actual Firebase values in .env (this file is git-ignored)
   ```

2. **Edit `firebase-config.js` locally** – replace each `__PLACEHOLDER__` with the
   corresponding value from your Firebase project. For example:

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "my-project.firebaseapp.com",
     // ...
   };
   ```

   > ⚠️ **Do not commit this file** after adding real values – `git diff` before
   > every commit to make sure `firebase-config.js` still shows placeholders.

3. Open `index.html` directly in a browser (or use a local server such as
   `python3 -m http.server 8080`).

---

## Required Environment Variables Reference

| Variable                       | Example value                                 |
|--------------------------------|-----------------------------------------------|
| `FIREBASE_API_KEY`             | `AIzaSy...`                                   |
| `FIREBASE_AUTH_DOMAIN`         | `pmpml-bus-finder.firebaseapp.com`            |
| `FIREBASE_PROJECT_ID`          | `pmpml-bus-finder`                            |
| `FIREBASE_STORAGE_BUCKET`      | `pmpml-bus-finder.firebasestorage.app`        |
| `FIREBASE_MESSAGING_SENDER_ID` | `16595450914`                                 |
| `FIREBASE_APP_ID`              | `1:16595450914:web:6f971f2687531431509e7b`    |
| `FIREBASE_MEASUREMENT_ID`      | `G-WN7VE2L15G`                               |

---

## Firebase Security Rules

Make sure your Firestore and Storage rules only allow authenticated users to write.
Example Firestore rule:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{docId} {
      allow read, write: if request.auth != null;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
