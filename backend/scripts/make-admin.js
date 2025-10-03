const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const makeUserAdmin = async (email) => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        isAdmin: true,
        isActive: true 
      },
      { 
        new: true,
        select: 'name email isAdmin isActive'
      }
    );

    if (!user) {
      console.log('❌ User not found with email:', email);
      return;
    }

    console.log('🎉 User updated successfully:');
    console.log('📧 Email:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🔑 Is Admin:', user.isAdmin);
    console.log('✅ Is Active:', user.isActive);

  } catch (error) {
    console.error('❌ Error updating user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Disconnected from MongoDB');
  }
};

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide email address');
  console.log('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

makeUserAdmin(email);
