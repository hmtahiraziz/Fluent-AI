# Fluent AI

Language-practice app: React Native client + Express API (Drizzle ORM + Neon Postgres).

## Features

- **AI conversations** — practice with an adaptive AI tutor; start new chats by topic or resume recent ones
- **Smart vocabulary** — save words from practice and review them in the Words tab
- **Personalized onboarding** — native & target language, level, motivation, and daily goal → custom plan
- **Daily goals & streaks** — track practice consistency with streak badges across the app
- **Auth** — email/password signup & sign-in (13+ age confirmation), forgot/reset password (email), refresh-token sessions
- **Profile** — display name, avatar (on-device), language/level settings, logout, account deletion


## How the app works

FluentAI builds a personal plan from onboarding, then coaches you in chat and turns corrections into vocabulary.

1. **Native & learning language** — You choose the language you already speak and the one you want to learn. The AI tutor replies in your **target language**. When it corrects a mistake, the explanation is written in your **native language** so feedback is easy to understand. Both can be changed later in Profile.

2. **Motivation** — You pick why you are learning (travel, work, school, family, or just for fun). That goal shapes your plan and practice focus so scenarios feel useful for real life.

3. **CEFR level (A1–C2)** — You set your starting level from beginner to proficient. The tutor matches that level: simple words and short sentences at A1/A2, richer discussion at B1/B2, and near-native nuance at C1/C2. Corrections only appear when something is worth fixing for *your* level.

4. **Daily goal** — You choose a daily pace (5, 10, 15, or 20 minutes). Practice tracks progress toward that goal and shows streaks so consistency stays visible. Longer daily goals project a faster path to the next fluency level.

5. **AI chat tutor** — From Practice you start a new chat by topic or resume a recent one. The tutor keeps a friendly tone, asks natural follow-ups, and returns structured feedback: a reply plus an optional correction (original → fixed → short explanation in your native language).

6. **Smart vocabulary** — When the tutor corrects a phrase, you can save it to your personal word list. Vocabulary is tied to your learning language and lives in the Words tab for search and review—built from real chat mistakes, not a generic list.

**Flow:** Sign up → onboarding (languages, motivation, level, daily goal) → personalized plan → first practice chat → save corrections / suggested words to Words → keep practicing toward your daily goal and streak.



## Backend

```powershell
cd backend
copy .env.example .env
# Edit .env — JWT_SECRET ≥32 chars; set CORS_ORIGIN
# Production also requires: SMTP_USER, SMTP_APP_PASSWORD, EMAIL_FROM, OTP_SECRET, APP_PUBLIC_URL (https), SUPPORT_EMAIL
npm install
npm run db:generate
npm run db:migrate
# or: npm run db:push
npm run dev
```




```powershell
npm run verify:smtp
# optional test message to yourself:
node scripts/verify-smtp.mjs --send
```

5. Apply DB changes for OTP columns, then run tests:

```powershell
npm run db:push
npm test
```


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

