# TÃ i Xá»‰u Game - Backend (NestJS)

## Setup


3. Run development server:
```
npm run start:dev
```

## Project Structure

- src/auth - Authentication & JWT
- src/users - User management
- src/wallet - Wallet system
- src/game - Game logic & Socket.IO
- src/admin - Admin controls
- src/history - Game history & statistics
- src/common - Shared utilities

## API Endpoints

### Auth
- POST /auth/register
- POST /auth/login
- GET /auth/me

### Game (Socket.IO)
- game:join - Join game room
- game:bet - Place bet
- game:result - Get result

### Admin
- POST /admin/wallet/adjust
- POST /admin/game/set-result
- GET /admin/users
- GET /admin/statistics
