const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// routes
const testRoutes = require("./routes/testRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const auditRoutes = require("./routes/auditRoutes");
const accessRoutes = require("./routes/accessRoutes");
const decryptRoutes = require("./routes/decryptRoutes");

app.use("/api/test", testRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/decrypt", decryptRoutes);

// IMPORTANT FIX: mount upload correctly
app.use("/api", uploadRoutes);

app.get('/', (req, res) => res.send('API Running'));

module.exports = app;