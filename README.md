# Weylo

**Weylo** is a travel planning platform that lets you explore destinations, build custom routes, and visualize your journey on an interactive map.

## Features

- **Destination Exploration** – Browse countries, cities, and points of interest with category-based filtering
- **Route Planning** – Create multi-stop travel routes and view them on an interactive Google Map
- **Favorites** – Save destinations and routes for quick access
- **Weather** – Check weather conditions for any destination
- **User Accounts** – Register, log in, and manage your profile
- **Admin Dashboard** – Manage countries, cities, and destination data

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Maps | Google Maps API (`@react-google-maps/api`) |
| Backend | .NET 8 / ASP.NET Core microservices |
| Gateway | Ocelot API Gateway |
| Database | PostgreSQL 17 |
| Cache | Redis |
| Auth | JWT |
| API Docs | Swagger / OpenAPI |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend  (Next.js · localhost:3000)                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────────┐
│  API Gateway  (Ocelot · localhost:4000)                      │
└──────┬────────────────┬──────────────────┬──────────────────┘
       │                │                  │
┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼─────┐
│  Identity   │  │  User API   │  │  Admin API  │
│  :5000      │  │  :5001      │  │  :5002      │
└──────┬──────┘  └──────┬──────┘  └───────┬─────┘
       │                │                  │
       └────────────────▼──────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │  PostgreSQL :5433         │
          │  Redis      :6379         │
          └───────────────────────────┘
```

## Project Structure

```
Weylo/
├── FRONTEND/
│   └── weylo.front/          # Next.js application
│       └── src/app/
│           ├── (auth)/       # Login & register pages
│           ├── map/          # Interactive map page
│           ├── dashboard/    # User dashboard
│           ├── admin/        # Admin panel
│           ├── components/   # Shared UI components
│           ├── context/      # React contexts
│           ├── services/     # API service layer
│           ├── types/        # TypeScript interfaces
│           ├── hooks/        # Custom React hooks
│           └── utils/        # Utility functions
│
└── BACKEND/
    └── src/
        ├── weylo.identity/   # Auth service – register, login, JWT
        ├── weylo.user.api/   # Routes, destinations, categories, weather
        ├── weylo.admin.api/  # Country & city management
        ├── weylo.gateway/    # Ocelot API Gateway
        └── weylo.shared/     # Shared models, services, configurations
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.18 or later (20.x LTS recommended)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker](https://www.docker.com/) & Docker Compose (recommended for backend)
- A [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key)

### Run with Docker Compose (recommended)

The easiest way to start the entire backend stack:

```bash
cd BACKEND
docker-compose up -d
```

This starts PostgreSQL, Redis, Identity Service, User API, Admin API, and the API Gateway.

### Frontend

```bash
cd FRONTEND/weylo.front

# Install dependencies
npm install

# Create a local environment file and add your Google Maps key
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here" > .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend (without Docker)

```bash
cd BACKEND

# Restore dependencies
dotnet restore weylo.back.sln

# Run each service in a separate terminal
dotnet run --project src/weylo.identity/weylo.identity.csproj
dotnet run --project src/weylo.user.api/weylo.user.api.csproj
dotnet run --project src/weylo.admin.api/weylo.admin.api.csproj
dotnet run --project src/weylo.gateway/weylo.gateway.csproj
```

Make sure your `appsettings.Development.json` files in each service point to a running PostgreSQL instance and Redis.

## API Documentation

Swagger UI is available for each service when running in development mode:

| Service | URL |
|---|---|
| Identity | http://localhost:5000/swagger |
| User API | http://localhost:5001/swagger |
| Admin API | http://localhost:5002/swagger |
| Gateway | http://localhost:4000/swagger |

## Available Scripts (Frontend)

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## License

This project is licensed under the [Apache License 2.0](LICENSE).
