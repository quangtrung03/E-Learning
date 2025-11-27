const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../src/models/Category');
const Instructor = require('../src/models/Instructor');

dotenv.config();

const categories = [
  { 
    name: 'Web Development', 
    slug: 'web-development',
    count: '2,500+', 
    gradient: 'from-blue-600 to-cyan-600',
    description: 'Build modern web applications',
    imageUrl: '/uploads/categories/developweb.jpg',
    order: 1
  },
  { 
    name: 'Data Science', 
    slug: 'data-science',
    count: '1,800+', 
    gradient: 'from-cyan-600 to-blue-600',
    description: 'Analyze data and build ML models',
    imageUrl: '/uploads/categories/datasience.jpg',
    order: 2
  },
  { 
    name: 'UI/UX Design', 
    slug: 'ui-ux-design',
    count: '1,200+', 
    gradient: 'from-blue-500 to-cyan-500',
    description: 'Create beautiful user experiences',
    imageUrl: '/uploads/categories/uiux.jpg',
    order: 3
  },
  { 
    name: 'Digital Marketing', 
    slug: 'digital-marketing',
    count: '900+', 
    gradient: 'from-cyan-500 to-blue-500',
    description: 'Master online marketing strategies',
    imageUrl: '/uploads/categories/digital.png',
    order: 4
  }
];

const instructors = [
  { 
    name: 'Trần Minh Huy', 
    title: 'Full-Stack Development', 
    experience: '10+ years', 
    imageUrl: '/uploads/instructors/huy.png', 
    gradient: 'from-blue-600 to-cyan-600',
    order: 1
  },
  { 
    name: 'Dr. Nguyễn An Nhiên', 
    title: 'Data Science', 
    experience: 'PhD Stanford', 
    imageUrl: '/uploads/instructors/nhien.png', 
    gradient: 'from-cyan-600 to-blue-600',
    order: 2
  },
  { 
    name: 'Lê Quang Dũng', 
    title: 'UX/UI Design', 
    experience: 'Lead Designer', 
    imageUrl: '/uploads/instructors/dung.png', 
    gradient: 'from-blue-500 to-cyan-500',
    order: 3
  },
  { 
    name: 'Hoàng Thu Thảo', 
    title: 'Digital Marketing', 
    experience: '8+ years', 
    imageUrl: '/uploads/instructors/thao.png', 
    gradient: 'from-cyan-500 to-blue-500',
    order: 4
  },
  { 
    name: 'Phạm Gia Bảo', 
    title: 'Business Strategy', 
    experience: '15+ years', 
    imageUrl: '/uploads/instructors/bao.png', 
    gradient: 'from-blue-600 to-cyan-600',
    order: 5
  },
  { 
    name: 'Nguyễn Thị Linh', 
    title: 'Business English', 
    experience: 'MA Linguistics', 
    imageUrl: '/uploads/instructors/linh.png', 
    gradient: 'from-cyan-600 to-blue-600',
    order: 6
  }
];

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Instructor.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert categories
    const insertedCategories = await Category.insertMany(categories);
    console.log(`✅ Inserted ${insertedCategories.length} categories`);

    // Insert instructors
    const insertedInstructors = await Instructor.insertMany(instructors);
    console.log(`✅ Inserted ${insertedInstructors.length} instructors`);

    console.log('🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedData();
