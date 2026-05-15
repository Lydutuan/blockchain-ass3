
const express=require('express');
const cors=require('cors');
const helmet=require('helmet');
const morgan=require('morgan');

const app=express();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const testRoutes = require("./routes/testRoutes");

const uploadRoutes = require("./routes/uploadRoutes");

const auditRoutes = require("./routes/auditRoutes");

app.use("/api/upload", uploadRoutes);

app.use("/api/test", testRoutes);
app.get('/',(req,res)=>res.send('API Running'));

app.use(
  "/api/upload",
  uploadRoutes
);

app.use(
  "/api/audit",
  auditRoutes
);

module.exports=app;
