module.exports = {
  uiPort: process.env.PORT || 1880,
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || "ea7-mesh-secret-2024",
  adminAuth: {
    type: "credentials",
    users: [{
      username: process.env.NODE_RED_USERNAME || "admin",
      password: process.env.NODE_RED_PASSWORD || "$2b$08$1Z2PjDdU7sMfT3KwV6LkOeL8J9H0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6",
      permissions: "*"
    }]
  }
};
