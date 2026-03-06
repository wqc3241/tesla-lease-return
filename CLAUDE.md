# Tesla Lease Return App

## Overview
A high-fidelity React-based Tesla mobile app clone focused on lease return management. Originally built in Google AI Studio, now maintained locally with Vite. Features vehicle status monitoring, climate controls, charging management, lease return workflow, and a Gemini-powered smart vehicle assistant.

## Tech Stack
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (loaded via CDN in index.html)
- **AI**: Google Gemini API (`@google/genai`) for vehicle assistant chatbot
- **Fonts**: Inter (Google Fonts CDN)

## Project Structure
```
├── index.html          # Entry HTML (loads Tailwind CDN, fonts, global styles)
├── index.tsx           # React entry point (mounts <App />)
├── App.tsx             # Main app component (~1400 lines, all views/tabs)
├── constants.tsx       # Initial state defaults + SVG icon components (ICONS object)
├── types.ts            # TypeScript interfaces (VehicleState, LeaseState, TabType, ChatMessage)
├── useSpeechRecognition.ts # Custom hook wrapping Web Speech API for voice input
├── geminiService.ts    # GeminiService class wrapping @google/genai
├── vite.config.ts      # Vite config (env loading, path aliases, ngrok allowedHosts)
├── tsconfig.json       # TypeScript config
└── package.json        # Dependencies and scripts
```

## Commands
- `npm install` — install dependencies
- `npm run dev` — start Vite dev server (port 3000, host 0.0.0.0)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## Environment Variables
Set `GEMINI_API_KEY` in `.env.local` (gitignored via `*.local` pattern). Vite exposes it as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` via the `define` config.

## Architecture Notes
- **Single-file app**: All UI components and views live in `App.tsx`. Components include Button, MenuCard, TimelineItem, and tab views (Home, Controls, Location, Upgrades, Financing, LeaseManagement).
- **State management**: React useState hooks in the main App component for VehicleState and LeaseState. No external state library.
- **Icons**: Custom SVG icon components defined in `constants.tsx` as the `ICONS` object (Lock, Unlock, Climate, Flash, Honk, Frunk, Charging, ChevronRight, Bot, Dollar, Calendar, Check, Camera, Mic).
- **Navigation**: Tab-based navigation using `TabType` union type. Tabs: Home, Controls, Location, Upgrades, Financing, LeaseManagement.
- **Gemini chatbot**: `geminiService.ts` exports a singleton `gemini` instance. The `LeaseChatModal` in `App.tsx` injects a `TESLA_LEASE_KNOWLEDGE` constant (comprehensive knowledge base sourced from Tesla's official support pages) plus the customer's live lease status into every prompt. Responses are formatted with markdown rendering (bold, bullets, line breaks) in chat bubbles. Requires valid API key in `.env.local`.
- **Status-dependent chat**: `getChatConfig(daysLeft)` (defined above `LeaseChatModal` in `App.tsx`) returns a greeting and quick-action buttons based on lease status. Pre-60 (`>60`): 3 actions (Return Process, Wear & Tear, End Options). T-60/T-0 (`<=60 && >=0`): adds Current Offers. T+1 (`<0`): different greeting + Final Bill, End Options, Feedback. A `useEffect` watching `leaseState.daysLeft` resets the chat messages when status changes via Proto Controls. The "Call AI Voice Support" button is always shown regardless of status.
- **Camera walkaround inspection**: Step 1 of the Pre-Inspection uses the device rear camera (`getUserMedia`) to guide the user through 8 angles defined in `WALKAROUND_ANGLES` (constants.tsx). State includes `cameraAngleIndex`, `capturedImages`, `cameraError`, `isCameraReady`, `showCaptureFlash` with refs for video/canvas/stream. The progress bar is tappable to skip through angles for demo purposes. Captured photo thumbnails display on the estimate screen (Step 2).
- **Lease status card**: Shows term, lender (tappable to cycle through U.S. Bank, Chase, Santander, Ally, Tesla Finance), maturity date, and mileage tracking. The "Next Steps" section is hidden when `daysLeft > 60` (pre-60 status).
- **Proto controls**: Bottom bar with Pre-60/T-60/T-0/T+1 buttons that set `daysLeft` and `currentMileage` to different values per status (Pre-60 has smallest mileage).
- **Mobile-first design**: Dark theme (#0a0a0a background), touch-optimized, viewport locked to prevent scaling. Designed to look like the Tesla mobile app.
- **Voice input**: Both `LeaseChatModal` and `AssistantModal` support speech-to-text via the `useSpeechRecognition` hook (Web Speech API, no npm dependencies). A mic button appears between the text input and send button when the browser supports it (Chrome, Edge, Safari). Turns Tesla red with `animate-ping` while recording; interim transcript populates the input field in real time. Graceful degradation — mic button hidden in unsupported browsers (Firefox). Error messages (permission denied, no speech) display below the input bar.
- **ngrok**: Dev tunneling configured via `server.allowedHosts` in vite.config.ts.

## Conventions
- Tailwind utility classes for all styling (no CSS modules or styled-components)
- SVG icons as React components with spread props
- TypeScript with `any` used for some component props (Button, icon components)
- Path alias: `@` maps to project root
