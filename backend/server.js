
require('dotenv').config();
const mongoose=require('mongoose');
const app=require('./src/app');

mongoose.connect(process.env.MONGO_URI).then(()=>{
  console.log('MongoDB Connected');
  app.listen(process.env.PORT||5000,()=>console.log('Server running'));
});
