require('dotenv').config();
const mongoose = require('mongoose');

async function dropGridFSCollections() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Drop GridFS collections
    const collections = ['uploads.files', 'uploads.chunks', 'fs.files', 'fs.chunks'];
    
    for (const collectionName of collections) {
      try {
        await db.collection(collectionName).drop();
        console.log(`✅ Dropped collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 26) {
          console.log(`⚠️  Collection ${collectionName} does not exist (already deleted)`);
        } else {
          console.error(`❌ Error dropping ${collectionName}:`, error.message);
        }
      }
    }
    
    console.log('\n✨ GridFS collections cleanup complete!');
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropGridFSCollections();
