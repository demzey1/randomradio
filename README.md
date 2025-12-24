<<<<<<< HEAD
# Simple Radio — Deployment README

This repo contains a Node.js Express backend (`server.js`) and a single-page frontend (`index.html`). Below are recommended steps to publish the app using Google Cloud Run (backend) + Firebase Hosting (frontend). There is also an alternative quick-deploy path using Render.

Important: do NOT commit your Firebase service account JSON to the repository. Use Secret Manager or Cloud Run secrets instead.

Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated
- Firebase CLI (`firebase-tools`) installed
- Your GCP project ID and preferred region (e.g., `us-central1`)
- A Firebase service account JSON (do not commit it; store as secret)

Recommended (Cloud Run + Firebase Hosting)

1) Configure gcloud

```powershell
gcloud auth login
gcloud config set project PROJECT_ID
gcloud config set run/region REGION
```

2) Create a secret in Secret Manager for your Firebase service account JSON

```powershell
#gcloud secrets create firebase-sa --replication-policy="automatic"
gcloud secrets versions add firebase-sa --data-file="demas-c0d1d-firebase-adminsdk-fbsvc-21ce59eb28.json"
```

3) Build and push container

```powershell
gcloud builds submit --tag gcr.io/PROJECT_ID/simple-radio
```

4) Deploy to Cloud Run and attach secret

```powershell
gcloud run deploy simple-radio \
  --image gcr.io/PROJECT_ID/simple-radio \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "RR_JWT_SECRET=put_a_strong_secret_here" \
  --update-secrets "FIREBASE_SA=projects/PROJECT_ID/secrets/firebase-sa:latest"
```

This will make the service available at a Cloud Run URL. If you attached the secret as above, the app will have the `FIREBASE_SA` env variable available as the service account JSON string.

5) Configure Firebase Hosting to rewrite `/api/**` to Cloud Run

Edit `firebase.json` and replace `REGION` with your Cloud Run region. Then run:

```powershell
npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

Alternative: Render (simpler)

- Create a Web Service on Render, connect your repo, set `Start Command` to `node server.js`, add `RR_JWT_SECRET` as an env var, and add your Firebase credentials as a secret. Deploy.

Security checklist
- Set `RR_JWT_SECRET` to a long random value.
- Use Firestore/Storage rules to restrict writes.
- Do not commit `demas-...json` to source control.

Troubleshooting
- If Firestore fails to initialize in Cloud Run, verify the secret is available and the service account has adequate IAM permissions.
=======
# randomradio
Have fun
>>>>>>> badb9e0929ae9d0bf0fe6614ad4432e938906647
