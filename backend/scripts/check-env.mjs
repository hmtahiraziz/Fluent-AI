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
if (jwt.length < 16) {
  console.log("INVALID: JWT_SECRET must be at least 16 characters");
  process.exit(1);
}

const key = process.env.OPENAI_API_KEY.trim();
console.log("Env file structure: OK");
console.log(`PORT: ${process.env.PORT}`);
console.log(`DATABASE_URL: set (${process.env.DATABASE_URL.length} chars)`);
console.log(`JWT_SECRET: set (${jwt.length} chars)`);
console.log(`OPENAI_MODEL: ${process.env.OPENAI_MODEL}`);
console.log(
  `OPENAI_API_KEY: ${key.slice(0, 12)}...${key.slice(-4)} (${key.length} chars)`,
);
console.log(`Key has whitespace: ${/\s/.test(key)}`);
console.log(`Key wrapped in quotes: ${/^["']|["']$/.test(key)}`);

const res = await fetch("https://api.openai.com/v1/models", {
  headers: { Authorization: `Bearer ${key}` },
});

if (res.ok) {
  console.log("OpenAI API key: VALID");
} else {
  const body = await res.text();
  console.log(`OpenAI API key: INVALID (HTTP ${res.status})`);
  if (body.includes("invalid_api_key")) {
    console.log("Reason: invalid_api_key — create a new key at platform.openai.com");
  }
  process.exit(1);
}
