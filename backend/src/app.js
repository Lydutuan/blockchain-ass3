
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

app.use("/api/test", testRoutes);
app.get('/',(req,res)=>res.send('API Running'));

module.exports=app;
