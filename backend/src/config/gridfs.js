const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket;

const initGridFS = () => {
  const conn = mongoose.connection;
  
  if (conn.readyState === 1) {
    // MongoDB connected
    bucket = new GridFSBucket(conn.db, {
      bucketName: 'uploads' // Collection prefix: uploads.files, uploads.chunks
    });
    console.log('✅ GridFS initialized successfully');
  } else {
    conn.once('open', () => {
      bucket = new GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });
      console.log('✅ GridFS initialized successfully');
    });
  }
};

const getGridFSBucket = () => {
  if (!bucket) {
    throw new Error('GridFS not initialized. Call initGridFS() first.');
  }
  return bucket;
};

module.exports = {
  initGridFS,
  getGridFSBucket
};
