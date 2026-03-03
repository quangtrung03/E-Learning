# 🎓 E-Learning Platform

Nền tảng LMS full-stack với quản lý khóa học, học bài/assignment, thanh toán, chứng chỉ và analytics.

**Cập nhật:** 03/03/2026

---

## 📋 Tài liệu

- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Tình trạng dự án / tính năng
- [DOCS.md](./DOCS.md) — Guide + Email (Resend) + Cloudinary

---

## 🧰 Tech stack

- Backend: Node.js + Express + MongoDB/Mongoose
- Frontend: React + TypeScript + Vite
- Real-time: Socket.IO
- Storage: GridFS (video), Cloudinary (images)
- Email: Resend
- Payments: Stripe, VNPay, MoMo

---

## 🚀 Quick start (local)

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
cd backend
npm install

cd ../frontend
npm install
```

### 3. Cấu hình môi trường

**Backend** — tạo `backend/.env` (có thể copy từ `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/elearning

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_must_be_32_chars_long
JWT_EXPIRES_IN=7d

# Email (Resend)
RESEND_API_KEY=re_your_api_key_here_get_from_resend_dashboard
RESEND_FROM_EMAIL=E-Learning Platform <onboarding@resend.dev>

# URLs
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payments (tuỳ chọn khi dev)
STRIPE_SECRET_KEY=sk_test_...
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
MOMO_PARTNER_CODE=your_partner_code
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
```

> 📝 Setup dịch vụ: xem [DOCS.md](./DOCS.md)

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

## 📚 API documentation

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

## 🚀 Production build

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
└── *.md                     # Docs ở root (README/STATUS/GUIDE)
```

---

## 🎯 Tài liệu quan trọng

- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — Tình trạng dự án, tính năng
- [DOCS.md](./DOCS.md) — Guide + Email (Resend) + Cloudinary
- Swagger UI: http://localhost:5000/api-docs

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

Xem [PROJECT_STATUS.md](./PROJECT_STATUS.md) để biết chi tiết tính năng.

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
