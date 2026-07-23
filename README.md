# SplitGo — Share the ride, split the fare

Rapido-style ride booking jahan same-direction jaane wale do riders match
karke ek ride share karte hain aur fare dono ke beech split ho jaata hai.

## Structure

```
splitgo/
├── backend/    → Node.js + Express + MongoDB API
└── frontend/   → React (Vite) + Tailwind CSS
```

## Backend Setup

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET
npm install
npm run dev             # or: node server.js
```

Key files:
- `models/User.js`, `models/Ride.js` — Mongoose schemas (Ride has 2dsphere geo index)
- `utils/matching.js` — bearing + distance calculation, ride matching, fare-split logic
- `controllers/rideController.js` — creates a ride and immediately tries to match it
  with an existing "searching" ride
- `server.js` — Express + Socket.io (for live location sharing + in-ride chat)

### API Endpoints
| Method | Route                  | Description                          |
|--------|-------------------------|---------------------------------------|
| POST   | /api/auth/register      | Create account                        |
| POST   | /api/auth/login         | Login, returns JWT                    |
| POST   | /api/rides              | Book a ride (auto-tries matching)     |
| GET    | /api/rides/:id          | Get ride + match status               |
| PATCH  | /api/rides/:id/cancel   | Cancel a ride                         |

## Frontend Setup

```bash
cd frontend
cp .env.example .env    # set VITE_API_URL to your backend URL
npm install
npm run dev
```

Pages: Login, Register, Book Ride (pickup/drop entry), Ride Status
(polls for match + shows fare split).

## How Matching Works (MVP version)

1. Har ride ka "bearing" (direction angle) nikala jaata hai pickup→drop se.
2. Jab naya ride book hota hai, existing "searching" rides ke saath compare
   hota hai: pickup points close hain? drop points close hain? direction
   similar hai (bearing difference threshold ke andar)?
3. Best-scoring match select hota hai aur dono rides "matched" ho jaate hain.
4. Fare split: shared portion (default 70%) dono mein 50/50 split hota hai,
   baaki individual distance ke hisaab se.

This is intentionally simple for the MVP — next improvements:
- Real route polyline overlap (via Google Directions API) instead of just
  bearing + straight-line distance
- Google Maps location picker in the frontend (replacing manual lat/lng)
- Driver assignment flow + live tracking
- Payment gateway integration (Razorpay/Stripe)
- Push notifications for match found

## Suggested Next Steps
1. Set up MongoDB (local or Atlas) and test register/login/book-ride flow.
2. Replace manual lat/lng inputs with a real map picker.
3. Add driver app/flow (accept ride, navigate, complete ride).
4. Add ratings + ride history.
