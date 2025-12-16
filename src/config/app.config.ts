export default () => ({
  app: {
    name: process.env.APP_NAME || "oduko",
    base_url: process.env.BASE_URL || "http://localhost:4000",
    port: parseInt(process.env.PORT || '3030', 10),
    env: process.env.NODE_ENV || "development",
  },
  db: {
    type: process.env.DB_TYPE || "sqlite",
    name: process.env.DB_NAME || "wallet.db",
    logging: process.env.DB_LOGGING === 'true' || false,
  }
});
