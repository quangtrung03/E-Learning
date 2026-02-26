# 🎓 E-Learning Platform - Hệ thống Học Trực Tuyến

> Nền tảng LMS đầy đủ tính năng với quản lý khóa học, thanh toán, chứng chỉ, và phân tích học tập.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

**Cập nhật:** 26/02/2026  
**Trạng thái:** ✅ Production Ready  
**Phiên bản:** 1.0.0

---

## 📋 Tài liệu nhanh

- **📊 [PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Tình trạng dự án và tính năng đã hoàn thành
- **🚀 [Cài đặt nhanh](#-cài-đặt-nhanh)** - Setup trong 5 phút
- **🔧 [Cấu hình](#-cấu-hình)** - Environment variables
- **📖 [API Documentation](#-api-documentation)** - Swagger docs

---

## 🎯 Giới thiệu ngắn gọn

**E-Learning Platform** là LMS (Learning Management System) hoàn chỉnh, tối ưu để triển khai production. Hệ thống hỗ trợ:

- 👨‍🎓 **Học viên:** Học tập, làm bài tập, nhận chứng chỉ
- 👨‍🏫 **Giảng viên:** Quản lý khóa học, chấm bài, phân tích doanh thu
- 👨‍💼 **Admin:** Quản lý nền tảng, duyệt review, quản lý coupon
- 💳 **Thanh toán:** Stripe, VNPay, MoMo

### ✨ Tính năng nổi bật

✅ 100+ API endpoints | 30 frontend pages | 20+ data models  
✅ Discussion forum, Study groups, Real-time messaging  
✅ 4 loại bài tập (Quiz, Essay, Project, Coding)  
✅ Auto-generate PDF certificates  
✅ Advanced analytics & reporting  
✅ Admin review moderation & coupon management  
✅ N+1 query optimization - production ready

---

## 🚀 Cài đặt nhanh
- 👍 Like/Unlike posts
- 🚩 Report nội dung vi phạm

### 💳 Thanh toán & Coupon

- **3 phương thức thanh toán:**
  - 💳 Stripe (quốc tế)
  - 🇻🇳 VNPay (Việt Nam)
  - 📱 MoMo (Việt Nam)
- 🎫 Mã giảm giá (Coupon) - phần trăm hoặc số tiền cố định
- 🧾 Lịch sử giao dịch chi tiết
- 💰 Quản lý doanh thu cho giảng viên

### 📊 Phân tích & Thống kê

#### Học viên:
- ⏱️ Thống kê thời gian học
- 📈 Biểu đồ tiến độ
- 🎯 Điểm số các bài tập
- 📚 Số khóa học đã hoàn thành

#### Admin:
- 📊 Dashboard tổng quan
- 👥 Thống kê người dùng
- 💰 Doanh thu
- 📚 Khóa học phổ biến

### 🔐 Admin Panel

- 👥 Quản lý tất cả người dùng
- 📚 Duyệt/từ chối khóa học
- 🏷️ Quản lý danh mục
- 🎫 Tạo & quản lý coupon
- 📊 Xem analytics toàn hệ thống
- 🔒 Khóa/mở khóa tài khoản
- 👨‍💼 Cấp quyền Admin

---

## 🛠️ Công nghệ sử dụng

**Backend:** Node.js 18+, Express, MongoDB, Mongoose, Socket.IO, JWT  
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router  
**Payments:** Stripe, VNPay, MoMo  
**Storage:** GridFS, Cloudinary  
**Email:** SendGrid  
**Deploy:** Render (Backend), Vercel (Frontend)

---

## 📦 Cài đặt nhanh

### Yêu cầu hệ thống

- Node.js 18.0.0+
- MongoDB 7.0+
- npm hoặc yarn

### 1. Clone repository

```bash
git clone <repository-url>
cd E-Learning
```

### 2. Cài đặt dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Cấu hình môi trường

**Backend** - Tạo `backend/.env`:

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/elearning

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email (SendGrid)  
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payments
STRIPE_SECRET_KEY=sk_test_...
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
```

> 📝 **Chi tiết setup:** [SENDGRID_SETUP.md](./backend/SENDGRID_SETUP.md), [CLOUDINARY_SETUP.md](./backend/CLOUDINARY_SETUP.md)

**Frontend** - Tạo `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### 4. Khởi chạy

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# → http://localhost:5000

# Terminal 2 - Frontend
cd frontend  
npm run dev
# → http://localhost:5173
```

---

## ⚙️ Cấu hình

### Backend Configuration

Tạo file `.env` trong thư mục `backend/`:

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/elearning
# Hoặc MongoDB Atlas

## ⚙️ Cấu hình

Xem chi tiết environment variables trong các file:
- `backend/.env.example`
- `frontend/.env.example`

**Tài liệu setup chi tiết:**
- [SENDGRID_SETUP.md](./backend/SENDGRID_SETUP.md) - Cấu hình email service
- [CLOUDINARY_SETUP.md](./backend/CLOUDINARY_SETUP.md) - Cấu hình image storage

---

## 📚 API Documentation

**Swagger UI:** http://localhost:5000/api-docs (khi backend chạy)

**Các API endpoint chính:**
- **Auth:** `/api/auth/*` - Đăng ký, đăng nhập, xác thực email
- **Courses:** `/api/courses/*` - CRUD khóa học, đăng ký
- **Lessons:** `/api/lessons/*` - CRUD bài học, đánh dấu hoàn thành
- **Assignments:** `/api/assignments/*` - CRUD bài tập, nộp bài, chấm điểm
- **Payments:** `/api/payment/*` - Stripe, VNPay, MoMo
- **Reviews:** `/api/reviews/*` - Đánh giá khóa học, moderation
- **Admin:** `/api/admin/*` - Quản lý users, courses, reviews, coupons
- **Analytics:** `/api/analytics/*` - Thống kê học tập, doanh thu

---

## 🚀 Production Build

### Backend

```bash
cd backend
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Output: dist/
```

### Scripts hữu ích

```bash
# Backend
npm run dev          # Development với nodemon
npm run seed         # Seed database với dữ liệu mẫu
npm run make-admin   # Tạo tài khoản admin

# Frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Lint code
```

---

## 📁 Cấu trúc dự án

```
E-Learning/
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình (DB, Email, Cloudinary)
│   │   ├── controllers/     # Business logic (16 controllers)
│   │   ├── models/          # Mongoose models (20+ models)
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── services/        # Business services
│   │   └── server.js        # Entry point
│   ├── uploads/             # File storage (GridFS)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components (30 pages)
│   │   ├── services/        # API clients
│   │   ├── context/         # React context
│   │   ├── types/           # TypeScript types
│   │   └── App.tsx          # Main app component
│   ├── public/
│   └── package.json
│
└── Documentation/           # Tài liệu dự án
    ├── PROJECT_STATUS.md    # ⭐ Tình trạng dự án
    ├── README.md            # ← Tài liệu này
    ├── SENDGRID_SETUP.md    # Setup email
    └── CLOUDINARY_SETUP.md  # Setup storage
```

---

## 🎯 Tài liệu quan trọng

- **📊 [PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Tình trạng dự án, tính năng đã hoàn thành, roadmap
- **📖 [Swagger API Docs](http://localhost:5000/api-docs)** - API documentation đầy đủ
- **📧 [SENDGRID_SETUP.md](./backend/SENDGRID_SETUP.md)** - Cấu hình email service
- **☁️ [CLOUDINARY_SETUP.md](./backend/CLOUDINARY_SETUP.md)** - Cấu hình image/video storage

---

## 👥 User Roles

### Student (Học viên)
- Tìm kiếm và đăng ký khóa học
- Học bài, làm bài tập
- Tham gia thảo luận, study groups
- Theo dõi tiến độ học tập
- Nhận chứng chỉ

### Instructor (Giảng viên)
- Tạo và quản lý khóa học
- Upload video bài giảng
- Tạo bài tập và chấm điểm
- Quản lý học viên
- Xem thống kê doanh thu

### Admin (Quản trị viên)
- Quản lý tất cả users
- Duyệt khóa học, reviews
- Quản lý coupons
- Xem analytics toàn hệ thống
- Cấp quyền instructor/admin

---

## 🔒 Security Features

- ✅ JWT authentication với refresh tokens
- ✅ Email verification (OTP)
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (brute force protection)
- ✅ Input validation & sanitization
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ XSS protection

---

## 📞 Support & Contact

**Issues:** Báo lỗi tại GitHub Issues  
**Documentation:** Xem thêm tại PROJECT_STATUS.md  
**API Docs:** http://localhost:5000/api-docs

---

## 📄 License

MIT License - Xem [LICENSE](./LICENSE) để biết thêm chi tiết.

---

**🎉 Hệ thống đã sẵn sàng cho production! Xem [PROJECT_STATUS.md](./PROJECT_STATUS.md) để biết chi tiết về các tính năng đã hoàn thành.**

│   │
│   ├── scripts/             # Utility scripts
│   │   ├── seed-production.js
│   │   ├── create-platform-admin.js
│   │   └── clean-database.js
│   │
│   ├── uploads/             # Local file storage
│   ├── .env                 # Environment variables
│   ├── .env.example         # Example env file
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/          # Images, fonts, etc.
│   │   ├── components/      # React components
│   │   │   ├── common/      # Shared components
│   │   │   ├── course/      # Course-related components
│   │   │   ├── layout/      # Layout components
│   │   │   └── ...
│   │   │
│   │   ├── context/         # React Context (Auth, Theme, etc.)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   ├── utils/           # Helper functions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   │
│   ├── public/              # Static files
│   ├── .env                 # Environment variables
│   ├── .env.example         # Example env file
│   ├── tailwind.config.js   # Tailwind configuration
│   ├── vite.config.ts       # Vite configuration
│   └── package.json
│
├── README.md                # Tài liệu chính (file này)
└── copilot-instructions.md  # Hướng dẫn cho AI
```

---

**🎉 Hệ thống đã sẵn sàng cho production! Xem [PROJECT_STATUS.md](./PROJECT_STATUS.md) để biết chi tiết về các tính năng đã hoàn thành.**
