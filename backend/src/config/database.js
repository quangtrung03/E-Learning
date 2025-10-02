const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('🔗 Connection String:', process.env.MONGODB_URI ? 
      process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 
      'NOT SET'
    );
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('🌐 Host:', conn.connection.host);
    console.log('🗄️  Database:', conn.connection.name);
    console.log('📊 Ready State:', conn.connection.readyState);
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('📝 Error Message:', error.message);
    console.error('🔍 Error Code:', error.code);
    console.error('📚 Full Error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
