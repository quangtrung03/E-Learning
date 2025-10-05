const mongoose = require('mongoose');
const User = require('./src/models/User');
const EmailVerification = require('./src/models/EmailVerification');
require('dotenv').config();

const deleteUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete user
    const deletedUser = await User.findOneAndDelete({ email: email.toLowerCase() });
    if (deletedUser) {
      console.log('🗑️  User deleted:', deletedUser.email);
    } else {
      console.log('❌ User not found:', email);
    }

    // Delete verification records
    const deletedVerifications = await EmailVerification.deleteMany({ email: email.toLowerCase() });
    console.log('🗑️  Verification records deleted:', deletedVerifications.deletedCount);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
};

const email = process.argv[2];
if (!email) {
  console.log('Usage: node delete-user.js <email>');
  process.exit(1);
}

deleteUser(email);