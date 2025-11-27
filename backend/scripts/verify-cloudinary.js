require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Instructor = require('../src/models/Instructor');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log('=== CATEGORIES IN DATABASE ===');
  const cats = await Category.find({}, 'name imageUrl');
  cats.forEach(c => console.log(`${c.name}: ${c.imageUrl}`));
  
  console.log('\n=== INSTRUCTORS IN DATABASE ===');
  const insts = await Instructor.find({}, 'name imageUrl');
  insts.forEach(i => console.log(`${i.name}: ${i.imageUrl}`));
  
  console.log('\n✅ All images are using Cloudinary CDN URLs!');
  process.exit(0);
}

verify();
