# flexiScheduler React Frontend

Responsive React frontend for a Digital Twin-based dynamic scheduling dashboard for an automobile parts manufacturing factory.

## Features
- Responsive landing page inspired by the supplied reference
- Factory KPI cards and machine health panel
- Production schedule / Gantt-style timeline
- Simulated machine breakdown, rush order, and material delay interactions
- Event log, toast notifications, and workflow modal
- React state-based interactions
- Illustrative factory images from Unsplash

## Requirements
- Node.js 18 or newer
- npm

## Run in VS Code
1. Extract this folder.
2. Open the `autotwin-react-frontend` folder in VS Code.
3. Open Terminal → New Terminal.
4. Install packages:

   ```bash
   npm install
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL printed in the terminal (usually `http://localhost:5173`).

## Production build
```bash
npm run build
npm run preview
```

## Important
This is a frontend-only prototype. KPI values and scheduling data are illustrative, and disruption buttons simulate UI state changes. It is not yet connected to a backend, database, real sensors, or a real optimization algorithm. Images and Google Fonts require an internet connection.
