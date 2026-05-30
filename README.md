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

## Vercel deployment

Deploy **two separate Vercel projects** (frontend + backend).

### Backend project (`backend/` folder)

Environment variables:

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | long random secret |
| `JWT_REFRESH_SECRET` | long random secret |
| `FRONTEND_URL` | `https://fitorbit.vercel.app` |

Visit `https://your-backend.vercel.app/api/health` — should return JSON, not a crash.

### Frontend project (`frontend/` folder)

Environment variables:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-backend.vercel.app/api` |

**Note:** Real-time chat (Socket.io) requires a long-running server (Railway/Render), not Vercel serverless.

## Roles

- Client
- Trainer
- Nutritionist
- Admin
