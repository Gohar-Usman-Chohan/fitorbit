# fitorbit

FitOrbit — fitness platform FYP connecting clients with trainers and nutritionists.

## Stack

- **Frontend:** Next.js (port 3000)
- **Backend:** Express + MongoDB (port 5000)

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # then fill in your values
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env.local   # if present; configure API URL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Roles

- Client
- Trainer
- Nutritionist
- Admin
