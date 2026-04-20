export default () => ({
  app: {
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    rateLimitPerMinute: Number.parseInt(
      process.env.RATE_LIMIT_PER_MINUTE ?? "60",
      10,
    ),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? "replace-with-strong-secret",
    jwtExpirySeconds: Number.parseInt(process.env.JWT_EXPIRY ?? "86400", 10),
  },
  redis: {
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  },
  database: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://user:password@localhost:5432/wandersync",
  },
});
