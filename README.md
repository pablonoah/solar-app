# Green AI Solar -- Frontend

React frontend for predicting solar panel efficiency. Connects to the [FastAPI backend](https://github.com/pablonoah/green-ai-solar-backend) which serves a GradientBoosting ML model.

**Part of the [Green AI Solstice](https://github.com/pablonoah/Green_AI_Solstice) project -- ESILV**

## Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Animations:** Framer Motion
- **HTTP Client:** Axios
- **Icons:** Lucide React

## Features

- Interactive form to input solar panel parameters (temperature, irradiance, humidity, etc.)
- Real-time efficiency prediction via API call
- Data visualization with Recharts
- Responsive design

## Getting Started

```bash
git clone https://github.com/pablonoah/solar-app.git
cd solar-app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it.

> Make sure the [backend](https://github.com/pablonoah/green-ai-solar-backend) is running for predictions to work.

## Architecture

```
solar-app (this repo)          green-ai-solar-backend
+--------------------+         +------------------------+
|  React Frontend    |--HTTP-->|  FastAPI + ML Model    |
|  Vite + Tailwind   |        |  GradientBoosting      |
+--------------------+         +------------------------+
```

## Deployment

Frontend deployed on GitHub Pages. Backend deployed on Render.
