import "dotenv/config";

const required = [
  "PORT",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
];

for (const key of required) {
  const value = process.env[key];
  if (!value?.trim()) {
    console.log(`MISSING: ${key}`);
    process.exit(1);
  }
}

const jwt = process.env.JWT_SECRET;
if (jwt.length < 32) {
  console.log("INVALID: JWT_SECRET must be at least 32 characters");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !process.env.CORS_ORIGIN?.trim()) {
  console.log("INVALID: CORS_ORIGIN is required in production");
  process.exit(1);
}

const key = process.env.OPENAI_API_KEY.trim();
console.log("Env file structure: OK");
console.log(`PORT: ${process.env.PORT}`);
console.log(`DATABASE_URL: set (${process.env.DATABASE_URL.length} chars)`);
console.log(`JWT_SECRET: set (${jwt.length} chars)`);
console.log(`OPENAI_MODEL: ${process.env.OPENAI_MODEL}`);
console.log(`OPENAI_API_KEY: set (${key.length} chars)`);

const res = await fetch("https://api.openai.com/v1/models", {
  headers: { Authorization: `Bearer ${key}` },
});

if (res.ok) {
  console.log("OpenAI API key: VALID");
} else {
  console.log(`OpenAI API key: INVALID (HTTP ${res.status})`);
  process.exit(1);
}
