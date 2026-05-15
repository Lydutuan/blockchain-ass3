require("dotenv").config();

require("./src/listeners/medicalListener");
// Ensure Node uses reachable DNS servers for SRV lookups (fixes querySrv ECONNREFUSED)
const dns = require('dns');
try {
  const envServers = process.env.DNS_SERVERS;
  if (envServers) {
    const list = envServers.split(",").map(s => s.trim()).filter(Boolean);
    if (list.length) dns.setServers(list);
  } else {
    // fall back to public DNS which correctly supports SRV
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }
  console.log('DNS servers for Node resolver:', dns.getServers());
} catch (e) {
  console.warn('Could not set DNS servers:', e && e.message);
}
const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

// Function to connect to MongoDB with retry logic
const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✓ MongoDB Connected");
    })
    .catch((err) => {
      console.error("✗ MongoDB connection failed:", err.message);
      console.log("Retrying in 5 seconds...");
      setTimeout(connectDB, 5000);
    });
};

// Start server immediately, MongoDB can connect in the background
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}`);
});

// Connect to MongoDB with retry
connectDB();