# APEX VIRTUS

Disciplined self-development system built on execution, data, and responsibility.

## Philosophy

- There are many valid tools
- There are no valid excuses
- Choose a method
- Apply it fully
- Follow through with data
- Optimize
- Let results decide

## Structure

**Core System:**
- Goals (high-level objectives)
- Targets (measurable outcomes)
- Methods (chosen approaches)
- Actions (daily execution)
- Reviews (periodic assessment)

**Modules:**
- Fitness & Strength
- Recovery & Sleep
- Discipline & Routines
- Knowledge & Learning
- Strategy & Work

## Setup

**Requirements:**
- Node.js 18+
- npm

**Install:**
```bash
npm install
```

**Run locally:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Access from mobile device on local network:**
```bash
npm run dev -- --host 0.0.0.0
```

Then access via your machine's local IP address (e.g., `http://192.168.1.x:5173`)

## Data Storage

Currently uses JSON file storage in `data/db.json`.

Data persists between sessions. To reset:
```bash
rm -rf data/
```

## Deployment

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

For DigitalOcean deployment, use App Platform or Droplet with Node.js adapter.

## Technical Details

- **Framework:** SvelteKit
- **Language:** TypeScript
- **Storage:** JSON (migrate to PostgreSQL later)
- **Style:** Minimal, functional, brutal clarity

## No Bullshit

This system:
- Does not motivate
- Does not comfort
- Does not gamify
- Does not praise

It tracks reality. It shows results. It flags failure.

Responsibility is yours.
