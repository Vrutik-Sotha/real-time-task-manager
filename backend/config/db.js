const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task_manager');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log("Host:", conn.connection.host);
console.log("Database:", conn.connection.name);
console.log("Connection String:", process.env.MONGODB_URI);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
