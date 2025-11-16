const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const createPlatformAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Import User model
    const User = require('../src/models/User');

    const adminEmail = 'elearnplatform1534@gmail.com';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin with this email already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('\n✅ Using existing admin account');
      
      await mongoose.connection.close();
      console.log('👋 Disconnected from MongoDB');
      return;
    }

    // Create new admin user
    const adminData = {
      name: 'E-Learning Platform Admin',
      email: adminEmail,
      password: 'Admin@2025!', // Strong password
      role: 'admin',
      isAdmin: true,
      emailVerified: true,
      isActive: true,
      adminRequestPending: false,
      bio: 'Platform Administrator',
      phone: '0123456789'
    };

    const admin = await User.create(adminData);

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📋 ACCOUNT DETAILS:');
    console.log('─────────────────────────────────────────────────────');
    console.log('👤 Name:           ', admin.name);
    console.log('📧 Email:          ', admin.email);
    console.log('🔑 Password:       ', 'Admin@2025!');
    console.log('🎭 Role:           ', admin.role);
    console.log('👑 Is Admin:       ', admin.isAdmin);
    console.log('✉️  Email Verified:', admin.emailVerified);
    console.log('✅ Is Active:      ', admin.isActive);
    console.log('🆔 User ID:        ', admin._id);
    console.log('─────────────────────────────────────────────────────\n');
    
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('─────────────────────────────────────────────────────');
    console.log('   Email:    elearnplatform1534@gmail.com');
    console.log('   Password: Admin@2025!');
    console.log('─────────────────────────────────────────────────────\n');
    
    console.log('⚠️  IMPORTANT: Please save these credentials securely!');
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createPlatformAdmin();
