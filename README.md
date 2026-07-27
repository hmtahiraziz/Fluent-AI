# AILanguage

Language-practice app: React Native client + Express API (see plan).

## Backend

```powershell
cd backend
copy .env.example .env
# Edit .env with your local values (see .env.example)
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Health check: `GET http://localhost:3000/health`


## Mobile (React Native + NativeWind)

```powershell
cd mobile
npm install
# Terminal 1 — backend at http://localhost:3000
# Terminal 2:
npm start
# Terminal 3:
npm run android
```

- **API URL:** Profile tab → set base URL. Emulator Android: `http://10.0.2.2:3000`. Physical device: `http://<your-PC-LAN-IP>:3000`.
- **Stack:** NativeWind (Tailwind), React Navigation (auth + tabs + chat), Axios + JWT in AsyncStorage.
- **Tabs:** Practice (chats), Words (vocabulary), Profile (language/level + logout).
