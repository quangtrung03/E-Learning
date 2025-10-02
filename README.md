# 🎓 E-Learning Platform

Hệ thống học trực tuyến được xây dựng với Node.js, Express, React và MongoDB.

## 🚀 Tính năng hiện tại

### Đã hoàn thành ✅
- **Authentication System**: Đăng ký, đăng nhập với JWT
- **User Management**: Quản lý người dùng (Student, Teacher, Admin)
- **Course Management**: CRUD khóa học cơ bản
- **Database**: Tích hợp MongoDB với Mongoose
- **Frontend**: React + TypeScript + TailwindCSS
- **API Integration**: Axios với interceptors
- **Protected Routes**: Bảo vệ routes theo authentication
- **Responsive Design**: Giao diện responsive cơ bản

### Đang phát triển 🚧
- Lesson Management (Quản lý bài học)
- Course Enrollment System (Hệ thống đăng ký khóa học)
- Video Player Integration
- Progress Tracking
- Payment Integration

## 📁 Cấu trúc dự án

```
E-Learning/
├── backend/                 # Node.js API Server
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── models/         # MongoDB Models
│   │   ├── routes/         # API Routes
│   │   ├── middleware/     # Auth & Validation
│   │   └── config/         # Database config
│   └── package.json
│
├── frontend/               # React TypeScript App
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React Context (Auth)
│   │   ├── services/      # API calls
│   │   └── utils/         # Helper functions
│   └── package.json
│
└── README.md              # This file
```

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js + Express.js**: REST API Server
- **MongoDB + Mongoose**: Database & ODM
- **JWT**: Authentication & Authorization
- **bcryptjs**: Password hashing
- **express-validator**: Data validation
- **CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: UI Library
- **TypeScript**: Type safety
- **Vite**: Build tool
- **TailwindCSS**: Styling framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Context API**: State management

## 🚀 Cách chạy dự án

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account hoặc MongoDB local
- Git

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env với thông tin database của bạn
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elearning

# Start server
npm run dev
```

Backend sẽ chạy tại: http://localhost:5000

### Frontend Setup

```bash
# Navigate to frontend  
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `PUT /api/auth/update-profile` - Cập nhật profile

### Courses
- `GET /api/courses` - Lấy danh sách khóa học (có filter, sort, pagination)
- `GET /api/courses/:id` - Lấy chi tiết khóa học
- `POST /api/courses` - Tạo khóa học mới (Teacher only)
- `PUT /api/courses/:id` - Cập nhật khóa học (Owner/Admin only)
- `DELETE /api/courses/:id` - Xóa khóa học (Owner/Admin only)
- `POST /api/courses/:id/enroll` - Đăng ký khóa học

### Health Check
- `GET /api/health` - Kiểm tra trạng thái server

## 👥 User Roles

1. **Student**: Xem và đăng ký khóa học
2. **Teacher**: Tạo và quản lý khóa học của mình
3. **Admin**: Quản lý toàn bộ hệ thống

## 🔐 Demo Accounts

Để test, bạn có thể tạo tài khoản hoặc sử dụng demo accounts trong trang login.

## 📝 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elearning
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Error**: Kiểm tra CLIENT_URL trong backend .env
2. **Database Connection**: Verify MongoDB connection string
3. **Port Already in Use**: Change PORT in backend .env
4. **TypeScript Errors**: Run `npm run build` to check

### Development Notes

- Backend API documentation: http://localhost:5000/api/health
- MongoDB connection test trong console khi start server
- Frontend hot reload enabled với Vite
- TailwindCSS classes được optimize tự động

## 📋 TODO Roadmap

### Phase 2
- [ ] Complete Lesson Management
- [ ] Video Upload & Streaming
- [ ] Quiz System
- [ ] Discussion Forum
- [ ] Real-time Chat

### Phase 3
- [ ] Payment Integration (VNPay/MoMo)
- [ ] Certificate Generation
- [ ] Advanced Analytics
- [ ] Mobile App (React Native)
- [ ] Push Notifications

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Contact

- Developer: [Your Name]
- Email: [Your Email]
- GitHub: [Your GitHub]

---

**Status**: ✅ MVP Ready - Basic functionality working
**Last Updated**: October 2025
