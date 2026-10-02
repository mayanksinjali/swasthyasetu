# SwasthyaSetu

SwasthyaSetu (Health Bridge) is a frontend prototype for community health referral coordination. It helps a coordinator review fictional cases, calculate explainable coordination priorities, compare suitable facilities, and track referral, transport, and follow-up steps in one workspace.

## Live Demo

[https://swasthyasetu.pages.dev](https://swasthyasetu.pages.dev)

## Run Locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build` or serve it locally with `npm run preview`.

## Main Routes

- `/` — product homepage
- `/dashboard` — operational command center
- `/cases/new` — four-step case intake and assessment
- `/cases` and `/cases/:caseId` — case list and workspace
- `/referrals`, `/facilities`, `/transport`, `/follow-up` — coordination worklists

## Demo Boundaries

All seed records and institutions are fictional. State is held in browser memory and resets on refresh. Priority and facility matching use deterministic frontend rules; facility responses, transport dispatch, and follow-up completion are coordinator-triggered simulations. The prototype has no backend, database, external healthcare integrations, or real patient data. It is not a medical device and does not provide diagnosis or treatment advice.
