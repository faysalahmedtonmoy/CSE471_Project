# Ashe Pashe - Project Setup and Run Guide

## Project Structure

The project is now organized into two main folders:

```
CSE471_Project/
├── frontend/          # Next.js Frontend Application
│   ├── app/
│   │   ├── api/       # API Routes (Next.js)
│   │   ├── admin/
│   │   ├── chat/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── profile/
│   │   ├── register/
│   │   ├── services/
│   │   └── ...
│   ├── components/    # React Components
│   ├── styles/        # CSS Styles
│   ├── public/        # Static Assets
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── middleware.js  # Next.js Middleware
│
└── backend/           # Backend Business Logic & Models
    ├── controllers/   # Request Handlers
    ├── models/        # Database Models (MongoDB)
    ├── lib/           # Utility Functions
    ├── scripts/       # Database Seed Scripts
    └── package.json
```

## Installation & Setup

### 1. Install Dependencies

**Option 1: Install All at Once (Using npm workspaces)**
```bash
cd CSE471_Project
npm install-all
```

**Option 2: Install Manually**
```bash
# Install frontend dependencies
cd CSE471_Project/frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Variables

Make sure you have `.env` and `.env.local` files in:
- `frontend/` - Contains NEXT_PUBLIC_* and API configuration
- `backend/` - Contains MongoDB URI, email credentials, etc.

Required environment variables:
```
MONGODB_URI=mongodb://...
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
JWT_SECRET=your-secret-key
```

## Running the Project

### Development Mode

**Run Both Frontend and Backend Together:**
```bash
cd CSE471_Project
npm run dev
```

**Run Frontend Only:**
```bash
cd frontend
npm run dev
```
Frontend will be available at: `http://localhost:3000`

**Run Backend Only (for API endpoints):**
```bash
cd backend
npm run dev
```

### Production Build

```bash
# Build frontend
cd frontend
npm run build
npm start
```

## Key Changes Made

1. **Folder Separation:**
   - Frontend handled by Next.js with all UI pages and components
   - Backend contains business logic (controllers, models, database utilities)

2. **Import Path Updates:**
   - API routes now correctly reference backend models, controllers, and utilities
   - Example: `import User from "../../../../backend/models/User"`

3. **Package Management:**
   - Separate `package.json` for frontend and backend
   - Root `package.json` manages workspace configuration
   - Each folder has its own dependencies

4. **Middleware:**
   - Moved from backend to frontend as it's a Next.js middleware

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Change Next.js port
npm run dev -- -p 3001
```

### Module not found errors
Ensure all imports use the correct relative paths:
- From API routes going to backend: use `../../../../../backend/...`
- From components going to components: use `../../components/...`

### Database connection issues
- Verify MONGODB_URI is correct in `.env` files
- Check that MongoDB service is running
- test connection with: `node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI)"`

### Missing node_modules
```bash
# Clean install
rm -r node_modules package-lock.json
npm install
```

## Nearby Hospital, Ambulance, and Fire Service Search

The project includes a dedicated emergency service search flow that lets users find nearby hospitals, ambulances, and fire services based on their current GPS location.

- `frontend/components/HospitalSearch.jsx` — client-side UI that requests browser geolocation, sends coordinates to the server, and renders nearby service cards.
- `frontend/app/services/page.jsx` — page wrapper that displays the search component.
- `frontend/app/api/services/route.js` — backend route that queries `backend/models/HospitalEmergency.js`, computes distance, filters by radius and type, and returns nearby results.
- `frontend/app/api/services/seed.js` — sample seeding script for hospital/fire/ambulance data.

### Seed emergency data
Run this from the repo root:
```bash
node frontend/app/api/services/seed.js
```
This seeds sample nearby hospital, ambulance, and fire service records into MongoDB.

## File Responsibilities

### Frontend
- `frontend/app/api/auth/register/route.ts` — OTP registration and user creation.
- `frontend/app/api/auth/login/route.ts` — login API connector.
- `frontend/app/api/auth/complete-registration/route.ts` — OTP verification and account activation.
- `frontend/app/api/auth/verify-code/route.js` — verify code endpoint for additional auth flows.
- `frontend/app/api/auth/profile/route.js` — fetch/update current user profile.
- `frontend/app/api/auth/update-profile/route.js` — profile update endpoint.
- `frontend/app/api/admin/users/route.js` — admin user management endpoint.
- `frontend/app/api/listings/route.js` — real estate listings CRUD.
- `frontend/app/api/jobs/route.js` — job posting and search.
- `frontend/app/api/institutes/route.js` — institute posting and search.
- `frontend/app/api/service-requests/route.js` and `frontend/app/api/service-requests/[id]/route.js` — service request creation and status tracking.
- `frontend/app/api/message/route.js` — messaging endpoint.
- `frontend/app/api/services/search/route.js` — generic service search.
- `frontend/app/api/services/route.js` — nearby hospital/fire/ambulance search.
- `frontend/components/HospitalSearch.jsx` — search form UI and results display.
- `frontend/app/real-estate/page.jsx`, `frontend/app/jobs/page.jsx`, `frontend/app/service-requests/page.jsx` — feature pages for Module 2.

### Backend
- `backend/lib/mongodb.js` — MongoDB connection helper.
- `backend/controllers/authController.js` — shared auth logic and JWT handling.
- `backend/models/User.js` — user and provider schema.
- `backend/models/HospitalEmergency.js` — hospital/fire/ambulance location schema.
- `backend/scripts/seed.js` — initial seed script for database data.

## Contributor Notes

The repository history shows these contributors:
- `faysalahmedtonmoy`
- `sadiasharminshawn21`
- `FardinSadidChowdhury16`
- `atiahaqueasha-asha`

At the time of this update, the project contains new or untracked frontend files, so exact line-by-line member ownership cannot be determined from the current git HEAD. If you want, I can also add explicit comments into each file with contributor names once you provide the ownership breakdown.

## Next Steps (Optional Enhancements)

1. **Path Aliases** - Configure `tsconfig.json` to use `@/components` instead of relative paths
2. **API Proxying** - Set up a separate Express server for backend API routes
3. **Docker** - Containerize frontend and backend separately
4. **CI/CD** - Set up GitHub Actions for automated deployment

---

Project is now ready to run! Start with `npm install-all && npm run dev` in the root directory.
