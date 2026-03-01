const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// NOTE:
// Previously this script deleted by a hard-coded model list, which can miss collections
// (e.g. enrollments). This version enumerates ALL collections in the database.

const cleanDatabase = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('🏷️  Database:', mongoose.connection.name);
    console.log('🖥️  Host:', mongoose.connection.host);
    console.log('');

    console.log('🗑️  Cleaning database...\n');

    const allCollections = await mongoose.connection.db.listCollections().toArray();
    if (!allCollections.length) {
      console.log('ℹ️  No collections found. Nothing to clean.');
    } else {
      for (const { name } of allCollections) {
        if (name && name.startsWith('system.')) continue;

        const result = await mongoose.connection.db.collection(name).deleteMany({});
        console.log(`  ✅ Deleted ${result.deletedCount} docs from ${name}`);
      }
    }

    console.log('\n✨ Database cleaned successfully!\n');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
};

cleanDatabase();
