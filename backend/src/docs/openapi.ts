/** Lightweight OpenAPI shapes — avoids IDE resolution issues with `openapi-types`. */
type SchemaObject = Record<string, unknown>;
type SecuritySchemeObject = Record<string, unknown>;
type OpenApiDocument = {
  openapi: string;
  info: Record<string, unknown>;
  servers: Array<Record<string, unknown>>;
  tags: Array<Record<string, unknown>>;
  components: Record<string, unknown>;
  paths: Record<string, unknown>;
};

const bearerAuth: SecuritySchemeObject = {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description:
    "Paste a JWT access token from POST /api/auth/login (or Authorize with passwordAuth below).",
};

/** Swagger UI Authorize → username = email, password = account password. */
const passwordAuth: SecuritySchemeObject = {
  type: "oauth2",
  description:
    "Sign in with your FluentAI email and password. Use your account email in the username field.",
  flows: {
    password: {
      tokenUrl: "/api/auth/token",
      scopes: {},
    },
  },
};

/** Prefer password Authorize in Swagger; Bearer still works for pasted JWTs. */
const protectedSecurity = [{ passwordAuth: [] }, { bearerAuth: [] }];

const errorSchema: SchemaObject = {
  type: "object",
  properties: {
    error: { type: "string" },
    details: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  },
  required: ["error"],
};

const userSchema: SchemaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
  },
  required: ["id", "email"],
};

const settingsSchema: SchemaObject = {
  type: "object",
  properties: {
    targetLanguage: { type: "string", example: "es" },
    nativeLanguage: { type: "string", example: "en" },
    level: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
    motivation: {
      type: "string",
      enum: ["travel", "work", "school", "family", "fun"],
    },
    onboardingCompleted: { type: "boolean" },
    dailyGoalMinutes: { type: "integer", minimum: 5, maximum: 120 },
    llmConsentVersion: { type: "string", nullable: true },
    llmConsentAt: { type: "string", format: "date-time", nullable: true },
    hasLlmConsent: { type: "boolean" },
  },
};

const tokenPairSchema: SchemaObject = {
  type: "object",
  properties: {
    accessToken: { type: "string" },
    refreshToken: { type: "string" },
  },
  required: ["accessToken", "refreshToken"],
};

const conversationSchema: SchemaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    title: { type: "string", nullable: true },
    language: { type: "string" },
    level: { type: "string" },
    nativeLanguage: { type: "string" },
    motivation: { type: "string" },
    topic: {
      type: "string",
      nullable: true,
      enum: ["grammar", "culture", "business", "travel"],
    },
    scenario: { type: "string", nullable: true, maxLength: 120 },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const vocabularySuggestionSchema: SchemaObject = {
  type: "object",
  properties: {
    term: { type: "string" },
    meaning: { type: "string" },
  },
  required: ["term", "meaning"],
};

const messageSchema: SchemaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    conversationId: { type: "string", format: "uuid" },
    role: { type: "string", enum: ["user", "assistant"] },
    content: { type: "string" },
    correction: {
      type: "object",
      nullable: true,
      properties: {
        original: { type: "string" },
        corrected: { type: "string" },
        explanation: { type: "string" },
        naturalAlternative: {
          type: "string",
          nullable: true,
          description:
            "Optional idiomatic alternative in the target language; null when not useful or would merely repeat corrected",
        },
      },
    },
    vocabularySuggestions: {
      type: "array",
      nullable: true,
      items: vocabularySuggestionSchema,
    },
    createdAt: { type: "string", format: "date-time" },
  },
};

const vocabularySchema: SchemaObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    language: { type: "string" },
    phrase: { type: "string" },
    phraseKey: { type: "string" },
    translation: { type: "string", nullable: true },
    note: { type: "string", nullable: true },
    pronunciation: { type: "string", nullable: true },
    exampleSentence: { type: "string", nullable: true },
    sourceMessageId: { type: "string", format: "uuid", nullable: true },
    learningState: {
      type: "string",
      enum: ["new", "learning", "review", "difficult", "mastered"],
    },
    easeFactor: { type: "number" },
    intervalDays: { type: "number" },
    repetitions: { type: "integer" },
    lapses: { type: "integer" },
    nextReviewAt: { type: "string", format: "date-time", nullable: true },
    lastReviewedAt: { type: "string", format: "date-time", nullable: true },
    reviewVersion: { type: "integer" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: { type: "string", format: "date-time", nullable: true },
  },
};

export const openApiDocument: OpenApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "FluentAI API",
    version: "1.0.0",
    description:
      "Language-learning AI tutor API. In Swagger UI use **Authorize → passwordAuth** with your email (username) and password, " +
      "or paste a JWT via bearerAuth. Password-reset OTPs are never returned in API responses (email only). " +
      "A short-lived resetToken is issued only after OTP verification.",
    contact: { email: "privacy@fluentai.app" },
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    { url: "https://api.fluentai.app", description: "Production" },
  ],
  tags: [
    { name: "Health", description: "Liveness and readiness probes" },
    { name: "Auth", description: "Registration, sessions, password reset, account deletion" },
    { name: "Languages", description: "Supported languages and CEFR levels" },
    { name: "Settings", description: "User learning preferences and LLM consent" },
    { name: "Chat", description: "Conversations and AI tutor messages" },
    { name: "Vocabulary", description: "Saved words and phrases" },
    {
      name: "Progress",
      description:
        "Weekly learning progress and practice-duration sync. Practice dates are client local YYYY-MM-DD; weekly aggregates use the requested IANA timezone calendar boundaries. Practice upserts are GREATEST(existing, submitted) per day (multi-device does not sum).",
    },
    { name: "Reports", description: "AI-generated content reports" },
  ],
  components: {
    securitySchemes: {
      passwordAuth,
      bearerAuth,
    },
    schemas: {
      Error: errorSchema,
      User: userSchema,
      Settings: settingsSchema,
      TokenPair: tokenPairSchema,
      Conversation: conversationSchema,
      Message: messageSchema,
      VocabularyItem: vocabularySchema,
      HealthLive: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
          service: { type: "string", example: "fluentai-api" },
          version: { type: "string" },
          env: { type: "string" },
          uptimeSec: { type: "integer" },
          timestamp: { type: "string", format: "date-time" },
        },
      },
      HealthReady: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ready", "degraded"] },
          service: { type: "string" },
          version: { type: "string" },
          env: { type: "string" },
          uptimeSec: { type: "integer" },
          checks: {
            type: "object",
            properties: {
              database: { type: "string", enum: ["up", "down"] },
              detail: { type: "string" },
            },
          },
          timestamp: { type: "string", format: "date-time" },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing or invalid access token",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      ValidationError: {
        description: "Request validation failed",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        description: "Returns OK if the process is running. Does not check the database.",
        operationId: "getHealthLive",
        responses: {
          "200": {
            description: "Service is alive",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthLive" },
              },
            },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        tags: ["Health"],
        summary: "Readiness probe",
        description: "Checks database connectivity. Returns 503 when degraded.",
        operationId: "getHealthReady",
        responses: {
          "200": {
            description: "Service is ready",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthReady" },
              },
            },
          },
          "503": {
            description: "Dependency failure",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthReady" },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "API readiness (alias)",
        description: "Same as GET /health/ready under the /api prefix.",
        operationId: "getApiHealth",
        responses: {
          "200": {
            description: "Service is ready",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthReady" },
              },
            },
          },
          "503": {
            description: "Dependency failure",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthReady" },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register",
        operationId: "register",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "ageConfirmed"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8, maxLength: 128 },
                  ageConfirmed: {
                    type: "boolean",
                    enum: [true],
                    description: "Must be true (13+ / local digital consent age)",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/TokenPair" },
                    {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        settings: { $ref: "#/components/schemas/Settings" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "409": {
            description: "Unable to create account",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        operationId: "login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/TokenPair" },
                    {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        settings: { $ref: "#/components/schemas/Settings" },
                      },
                    },
                  ],
                },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/token": {
      post: {
        tags: ["Auth"],
        summary: "OAuth2 password token (Swagger Authorize)",
        description:
          "OAuth2 password-grant style endpoint for Swagger UI. " +
          "Send form fields username (email), password, and grant_type=password. " +
          "Returns access_token for the Authorize dialog.",
        operationId: "oauthToken",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["username", "password", "grant_type"],
                properties: {
                  grant_type: {
                    type: "string",
                    enum: ["password"],
                    example: "password",
                  },
                  username: {
                    type: "string",
                    format: "email",
                    description: "Account email",
                  },
                  password: { type: "string", maxLength: 128 },
                },
              },
            },
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  grant_type: { type: "string", enum: ["password"] },
                  username: { type: "string", format: "email" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OAuth2 token response",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["access_token", "token_type"],
                  properties: {
                    access_token: { type: "string" },
                    refresh_token: { type: "string" },
                    token_type: { type: "string", example: "Bearer" },
                    expires_in: { type: "integer", description: "Seconds" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Unsupported grant or missing credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        operationId: "refresh",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Rotated token pair",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TokenPair" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (revoke refresh session)",
        security: protectedSecurity,
        operationId: "logout",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Logged out",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        security: protectedSecurity,
        operationId: "me",
        responses: {
          "200": {
            description: "User and settings",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    settings: { $ref: "#/components/schemas/Settings" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password-reset OTP email",
        description:
          "Always returns the same generic message. A six-digit OTP is emailed when an account exists (never returned in the API body).",
        operationId: "forgotPassword",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Generic acknowledgement",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/verify-reset-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify password-reset OTP",
        description:
          "Validates the six-digit OTP and returns a short-lived reset authorization token used by reset-password.",
        operationId: "verifyResetOtp",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "code"],
                properties: {
                  email: { type: "string", format: "email" },
                  code: {
                    type: "string",
                    pattern: "^\\d{6}$",
                    description: "Six-digit OTP from email",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP verified",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    resetToken: { type: "string" },
                    expiresInMinutes: { type: "integer" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid, expired, or locked-out code",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password with authorization token",
        description:
          "Requires the resetToken from a successful verify-reset-otp call. Revokes all refresh sessions.",
        operationId: "resetPassword",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: {
                    type: "string",
                    description: "Authorization token from verify-reset-otp",
                  },
                  password: { type: "string", minLength: 8, maxLength: 128 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Password updated; all sessions revoked",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { message: { type: "string" } },
                },
              },
            },
          },
          "400": {
            description: "Invalid or expired token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/auth/account": {
      delete: {
        tags: ["Auth"],
        summary: "Delete account",
        security: protectedSecurity,
        operationId: "deleteAccount",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { password: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "204": { description: "Account deleted" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/languages": {
      get: {
        tags: ["Languages"],
        summary: "List languages and CEFR levels",
        operationId: "listLanguages",
        responses: {
          "200": {
            description: "Supported languages",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    languages: { type: "array", items: { type: "object" } },
                    levels: { type: "array", items: { type: "object" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/settings": {
      get: {
        tags: ["Settings"],
        summary: "Get settings",
        security: protectedSecurity,
        operationId: "getSettings",
        responses: {
          "200": {
            description: "Settings",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Settings" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      patch: {
        tags: ["Settings"],
        summary: "Update settings / accept LLM consent",
        security: protectedSecurity,
        operationId: "patchSettings",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  targetLanguage: { type: "string" },
                  nativeLanguage: { type: "string" },
                  level: {
                    type: "string",
                    enum: ["A1", "A2", "B1", "B2", "C1", "C2"],
                  },
                  onboardingCompleted: { type: "boolean" },
                  dailyGoalMinutes: { type: "integer", minimum: 5, maximum: 120 },
                  motivation: {
                    type: "string",
                    enum: ["travel", "work", "school", "family", "fun"],
                  },
                  acceptLlmConsent: { type: "boolean", enum: [true] },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Updated settings",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Settings" },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/conversations": {
      get: {
        tags: ["Chat"],
        summary: "List conversations",
        security: protectedSecurity,
        operationId: "listConversations",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Conversations",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    conversations: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Conversation" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Chat"],
        summary: "Create conversation",
        security: protectedSecurity,
        operationId: "createConversation",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", maxLength: 200 },
                  topic: {
                    type: "string",
                    enum: ["grammar", "culture", "business", "travel"],
                  },
                  scenario: { type: "string", maxLength: 120 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    conversation: { $ref: "#/components/schemas/Conversation" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/conversations/{id}/messages": {
      get: {
        tags: ["Chat"],
        summary: "List messages",
        security: protectedSecurity,
        operationId: "listMessages",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          "200": {
            description: "Messages",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    messages: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Message" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Conversation not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Chat"],
        summary: "Send message (AI tutor reply)",
        description:
          "Requires LLM consent. Subject to daily AI quota and moderation. Max content length 4000.",
        security: protectedSecurity,
        operationId: "sendMessage",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string", minLength: 1, maxLength: 4000 },
                  clientRequestId: {
                    type: "string",
                    format: "uuid",
                    description:
                      "Optional client-generated idempotency key scoped to user + conversation",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User + assistant messages",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userMessage: { $ref: "#/components/schemas/Message" },
                    assistantMessage: { $ref: "#/components/schemas/Message" },
                    correction: { type: "object", nullable: true },
                    vocabularySuggestions: {
                      type: "array",
                      items: vocabularySuggestionSchema,
                    },
                  },
                },
              },
            },
          },
          "403": {
            description: "LLM consent required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "429": {
            description: "Daily AI quota exceeded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/vocabulary": {
      get: {
        tags: ["Vocabulary"],
        summary: "List vocabulary",
        security: protectedSecurity,
        operationId: "listVocabulary",
        parameters: [
          { name: "language", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 200 },
          },
          {
            name: "state",
            in: "query",
            schema: {
              type: "string",
              enum: ["new", "learning", "review", "difficult", "mastered"],
            },
          },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["created_at", "phrase", "next_review_at"],
            },
          },
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/VocabularyItem" },
                    },
                    nextCursor: { type: "string", nullable: true },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Vocabulary"],
        summary: "Save vocabulary item",
        security: protectedSecurity,
        operationId: "createVocabulary",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["phrase"],
                properties: {
                  phrase: { type: "string", maxLength: 500 },
                  translation: { type: "string", maxLength: 500 },
                  note: { type: "string", maxLength: 2000 },
                  language: { type: "string" },
                  sourceMessageId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    item: { $ref: "#/components/schemas/VocabularyItem" },
                    created: { type: "boolean" },
                  },
                },
              },
            },
          },
          "200": {
            description: "Existing or revived soft-deleted item",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    item: { $ref: "#/components/schemas/VocabularyItem" },
                    created: { type: "boolean" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/vocabulary/stats": {
      get: {
        tags: ["Vocabulary"],
        summary: "Vocabulary statistics",
        security: protectedSecurity,
        operationId: "vocabularyStats",
        parameters: [
          { name: "language", in: "query", schema: { type: "string" } },
          {
            name: "createdSince",
            in: "query",
            description:
              "ISO datetime for start of the client's local calendar day; when set, response includes createdToday",
            schema: { type: "string", format: "date-time" },
          },
        ],
        responses: {
          "200": {
            description:
              "Counts by learning state, dueCount (nextReviewAt null or due), and optional createdToday",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["total", "dueCount", "byState"],
                  properties: {
                    total: { type: "integer" },
                    dueCount: { type: "integer" },
                    createdToday: { type: "integer" },
                    byState: {
                      type: "object",
                      required: [
                        "new",
                        "learning",
                        "review",
                        "difficult",
                        "mastered",
                      ],
                      properties: {
                        new: { type: "integer" },
                        learning: { type: "integer" },
                        review: { type: "integer" },
                        difficult: { type: "integer" },
                        mastered: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/vocabulary/review-queue": {
      get: {
        tags: ["Vocabulary"],
        summary: "Due review queue",
        security: protectedSecurity,
        operationId: "vocabularyReviewQueue",
        parameters: [
          { name: "language", in: "query", schema: { type: "string" } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50 },
          },
        ],
        responses: {
          "200": { description: "Due items" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/vocabulary/{id}": {
      get: {
        tags: ["Vocabulary"],
        summary: "Get vocabulary item",
        security: protectedSecurity,
        operationId: "getVocabulary",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Item with optional source" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      patch: {
        tags: ["Vocabulary"],
        summary: "Update vocabulary item fields",
        security: protectedSecurity,
        operationId: "patchVocabulary",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  translation: { type: "string", nullable: true },
                  note: { type: "string", nullable: true },
                  pronunciation: { type: "string", nullable: true },
                  exampleSentence: { type: "string", nullable: true },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated item" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Vocabulary"],
        summary: "Soft-delete vocabulary item",
        security: protectedSecurity,
        operationId: "deleteVocabulary",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/vocabulary/{id}/restore": {
      post: {
        tags: ["Vocabulary"],
        summary: "Restore soft-deleted vocabulary item",
        security: protectedSecurity,
        operationId: "restoreVocabulary",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          "200": { description: "Restored item" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/vocabulary/{id}/review": {
      post: {
        tags: ["Vocabulary"],
        summary: "Submit spaced-repetition review rating",
        security: protectedSecurity,
        operationId: "reviewVocabulary",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating", "clientRequestId"],
                properties: {
                  rating: {
                    type: "string",
                    enum: ["again", "hard", "good", "easy"],
                  },
                  clientRequestId: { type: "string", format: "uuid" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description:
              "Updated item and review (idempotent by clientRequestId bound to this item)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["item", "review"],
                  properties: {
                    item: { $ref: "#/components/schemas/VocabularyItem" },
                    review: {
                      type: "object",
                      required: [
                        "id",
                        "rating",
                        "clientRequestId",
                        "status",
                        "createdAt",
                      ],
                      properties: {
                        id: { type: "string", format: "uuid" },
                        rating: {
                          type: "string",
                          enum: ["again", "hard", "good", "easy"],
                        },
                        clientRequestId: { type: "string", format: "uuid" },
                        status: { type: "string", enum: ["completed"] },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          "409": {
            description:
              "REVIEW_VERSION_CONFLICT or REVIEW_CLIENT_REQUEST_CONFLICT (clientRequestId already used for another item)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string" },
                    code: {
                      type: "string",
                      enum: [
                        "REVIEW_VERSION_CONFLICT",
                        "REVIEW_CLIENT_REQUEST_CONFLICT",
                      ],
                    },
                    item: { $ref: "#/components/schemas/VocabularyItem" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/progress/practice-daily": {
      put: {
        tags: ["Progress"],
        summary: "Upsert cumulative practice duration for a local calendar day",
        description:
          "Body.date is the client local practice date (YYYY-MM-DD), not remapped by the server timezone. durationMs is the cumulative daily total from this device; server stores GREATEST(existing, submitted).",
        security: protectedSecurity,
        operationId: "upsertPracticeDaily",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["date", "durationMs"],
                properties: {
                  date: { type: "string", format: "date" },
                  durationMs: {
                    type: "integer",
                    minimum: 0,
                    maximum: 86400000,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Stored cumulative duration for the day",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    date: { type: "string", format: "date" },
                    durationMs: { type: "integer" },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/progress/weekly": {
      get: {
        tags: ["Progress"],
        summary: "Seven-day learning progress summary",
        description:
          "Aggregates practice minutes, words learned, words reviewed, and Review Success Rate (good|easy over completed reviews; null if none) for the last 7 local calendar days in the requested IANA timeZone.",
        security: protectedSecurity,
        operationId: "weeklyProgress",
        parameters: [
          {
            name: "timeZone",
            in: "query",
            required: true,
            schema: { type: "string", example: "Asia/Karachi" },
          },
        ],
        responses: {
          "200": {
            description: "Weekly totals and per-day series",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "timeZone",
                    "days",
                    "totals",
                    "reviewSuccessRate",
                  ],
                  properties: {
                    timeZone: { type: "string" },
                    reviewSuccessRate: {
                      type: "number",
                      nullable: true,
                      description:
                        "Review Success Rate = (good+easy)/completed; null if no reviews. Not a proficiency score.",
                    },
                    totals: { type: "object" },
                    days: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string", format: "date" },
                          practiceMinutes: { type: "integer" },
                          wordsLearned: { type: "integer" },
                          wordsReviewed: { type: "integer" },
                          reviewSuccesses: { type: "integer" },
                          reviewTotal: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/reports": {
      post: {
        tags: ["Reports"],
        summary: "Report AI content",
        security: protectedSecurity,
        operationId: "createReport",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  conversationId: { type: "string", format: "uuid" },
                  messageId: { type: "string", format: "uuid" },
                  reason: {
                    type: "string",
                    enum: [
                      "inappropriate",
                      "harmful",
                      "incorrect",
                      "spam",
                      "other",
                    ],
                  },
                  details: { type: "string", maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Report stored",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    report: {
                      type: "object",
                      properties: { id: { type: "string", format: "uuid" } },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
};
