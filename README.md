# Miniature Tracker

A web app for tracking your tabletop miniature collection and painting progress.

## Features

- **Track your collection** — Add miniatures with a name, game system, faction, quantity, and optional photo
- **Painting status** — Mark each miniature as Unassembled, Assembled, or Painted
- **Search and filter** — Filter by game system, faction, or paint status, or search by name
- **Collection stats** — See total miniature counts, painting progress percentage, and a breakdown by game system and status
- **Image uploads** — Attach a photo to each miniature (JPG, PNG, GIF, WEBP up to 10MB)

## Tech Stack

- **Frontend** — React + Vite
- **Backend** — Node.js + Express
- **Database** — SQLite via better-sqlite3

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (LTS recommended)

### Installation

```bash
npm run install:all
```

### Running

```bash
npm run dev
```

This starts both the backend server (port 3001) and the frontend dev server (port 5173) concurrently.

Open [http://localhost:5173](http://localhost:5173) in your browser.
