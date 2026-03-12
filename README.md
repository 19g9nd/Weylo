<div align="center">

# ✈️ Weylo

### *Discover the World's Beauty*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![.NET](https://img.shields.io/badge/.NET-8-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

**Weylo** is a full-stack travel planning platform that lets you explore destinations, build custom multi-day routes, and visualize your entire journey on an interactive map.

![Weylo Hero](https://github.com/user-attachments/assets/85b8d822-9313-4f98-8ed4-49abf6f202cc)

</div>

---

## 🌟 Features

| | Feature | Description |
|---|---|---|
| 🗺️ | **Interactive Map** | Google Maps–powered exploration with custom markers and route overlays |
| 🧭 | **Route Planning** | Build multi-stop, multi-day itineraries with drag-and-drop day management |
| 🌍 | **Destination Explorer** | Browse countries, cities, and points of interest with category filters |
| ❤️ | **Favourites** | Save and revisit your favourite destinations and routes |
| 🌤️ | **Live Weather** | Check current weather conditions for any destination |
| 🔐 | **User Accounts** | Secure JWT-based register, login, and profile management |
| ⚙️ | **Admin Dashboard** | Full CRUD management of countries, cities, destinations, and users |

---

## 📸 Screenshots

<div align="center">

### Home Page
![Weylo Full Page](https://github.com/user-attachments/assets/a365ee10-f433-4eb1-976e-81f55bcd8314)

</div>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend  (Next.js · :3000)                                 │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────────┐
│  API Gateway  (Ocelot · :4000)                               │
└──────┬─────────────────┬──────────────────┬─────────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼─────┐  ┌────────▼────┐
│  Identity   │  │  User API   │  │  Admin API  │
│    :5000    │  │    :5001    │  │    :5002    │
└──────┬──────┘  └───────┬─────┘  └────────┬────┘
       │                 │                  │
       └─────────────────▼──────────────────┘
                         │
             ┌───────────┴───────────┐
             │  PostgreSQL  :5433    │
             │  Redis       :6379    │
             └───────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript 5, Tailwind CSS 4 |
| **Maps** | Google Maps API (`@vis.gl/react-google-maps`) |
| **Backend** | .NET 8 / ASP.NET Core — microservices architecture |
| **Gateway** | Ocelot API Gateway |
| **Database** | PostgreSQL 17 |
| **Cache** | Redis |
| **Auth** | JWT (JSON Web Tokens) |
| **API Docs** | Swagger / OpenAPI |
| **Analytics** | Vercel Analytics & Speed Insights |

---

## 📂 Project Structure

```
Weylo/
├── FRONTEND/
│   └── weylo.front/            # Next.js application
│       └── src/app/
│           ├── (auth)/         # Login & register pages
│           ├── map/            # Interactive map & route planner
│           ├── dashboard/      # User dashboard
│           ├── admin/          # Admin panel
│           ├── components/     # Shared UI components
│           ├── context/        # React contexts (Auth, Admin, Countries…)
│           ├── services/       # API service layer
│           ├── types/          # TypeScript interfaces
│           ├── hooks/          # Custom React hooks
│           └── utils/          # Utility functions
│
└── BACKEND/
    └── src/
        ├── weylo.identity/     # Auth service — register, login, JWT
        ├── weylo.user.api/     # Routes, destinations, categories, weather
        ├── weylo.admin.api/    # Country & city management
        ├── weylo.gateway/      # Ocelot API Gateway
        └── weylo.shared/       # Shared models, services, configurations
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18.18 or later (20.x LTS recommended)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker](https://www.docker.com/) & Docker Compose *(recommended for the backend)*
- A [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key)

---

### Option 1 — Docker Compose *(recommended)*

Spin up PostgreSQL, Redis, and all backend microservices in a single command:

```bash
cd BACKEND
docker-compose up -d
```

---

### Option 2 — Manual Setup

**Backend**

```bash
cd BACKEND

# Restore & build
dotnet restore weylo.back.sln

# Run each service in its own terminal
dotnet run --project src/weylo.identity/weylo.identity.csproj   # :5000
dotnet run --project src/weylo.user.api/weylo.user.api.csproj   # :5001
dotnet run --project src/weylo.admin.api/weylo.admin.api.csproj # :5002
dotnet run --project src/weylo.gateway/weylo.gateway.csproj     # :4000
```

> Make sure `appsettings.Development.json` in each service points to your running PostgreSQL and Redis instances.

**Frontend**

```bash
cd FRONTEND/weylo.front

# Install dependencies
npm install

# Set your Google Maps API key
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here" > .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 API Documentation

Swagger UI is available for each service in development mode:

| Service | URL |
|---|---|
| Identity | http://localhost:5000/swagger |
| User API | http://localhost:5001/swagger |
| Admin API | http://localhost:5002/swagger |
| Gateway  | http://localhost:4000/swagger |

---

## 💻 Frontend Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create an optimised production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## 📄 License

This project is licensed under the [Apache License 2.0](LICENSE).
