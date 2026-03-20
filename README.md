# Bunco Mobile Game

A cross-platform Bunco dice game for Android and iOS built with React Native and Expo.

## Features

- **Traditional Bunco rules**: 6 rounds, roll for 1s through 6s, score 15 to win a round
- **Scoring modes**: Individual (default) or Team (2v2)
- **1 human + 3 AI players** with real names (Marcus, Elena, Jordan, etc.)
- **Card table layout**: Top-down view with you at South, opponents at North, East, West
- **Celebrations**: Mini Bunco, Bunco/Round Win, and Game Win animations with sounds and haptics
- **Stats tracking**: Games played/won, rounds played/won, Buncos, Mini Buncos, top 10 scores (stored locally)
- **In-game menu**: New game, restart game, restart round, end game, show stats, toggle sounds/haptics

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   npm start
   ```

3. Run on device/simulator:
   - Press `a` for Android
   - Press `i` for iOS (requires Mac)
   - Or scan the QR code with Expo Go

## Optional: InstantDB for cloud stats

To sync stats across devices, add your InstantDB app ID:

1. Create an app at [instantdb.com](https://instantdb.com)
2. Copy your app ID
3. Create `.env` in the project root:
   ```
   EXPO_PUBLIC_INSTANT_APP_ID=your-app-id
   ```
4. Run `npx instant-cli init` to set up the schema
5. Push the schema: `npx instant-cli push`

Without InstantDB, stats are stored locally using AsyncStorage.

## Project structure

```
bunco/
├── app/              # Expo Router screens
├── src/
│   ├── components/   # Dice, PlayerCard, BuncoCelebration, GameMenu
│   ├── game/         # Game logic, dice, AI
│   ├── stores/       # Zustand game store
│   ├── services/     # Stats recording
│   ├── hooks/        # useGameEngine (AI turns)
│   ├── constants/    # Theme, game rules, AI names
│   └── lib/          # InstantDB client (when configured)
└── instant.schema.ts # InstantDB schema for stats
```
