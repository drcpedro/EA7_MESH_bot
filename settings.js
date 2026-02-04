cat > settings.js << 'EOF'
module.exports = {
  uiPort: process.env.PORT || 1880,
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET || "ea7-mesh-secret-2024",
  adminAuth: {
    type: "credentials",
    users: [{
      username: process.env.NODE_RED_USERNAME || "admin",
      password: process.env.NODE_RED_PASSWORD || "$2a$08$z7zPpUeB8yoGDgdO8HjqeOe6W0l2Zk.oqQxCwThGUJqg7oQBEwL8m",
      permissions: "*"
    }]
  }
};
EOF