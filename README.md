# 🎓 E-Learning Platform

> Nền tảng học trực tuyến (LMS) full-stack — dành cho Học viên, Giảng viên và Quản trị viên.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)

---

## ✨ Tính năng nổi bật

### 🎒 Học viên
- Tìm kiếm, đăng ký và thanh toán khóa học (hỗ trợ mã giảm giá)
- Xem bài giảng video, làm bài tập đa dạng (trắc nghiệm, tự luận, lập trình)
- Theo dõi tiến độ học tập, đặt mục tiêu cá nhân
- Thảo luận, nhóm học, nhắn tin real-time với giảng viên
- Nhận **chứng chỉ** sau khi hoàn thành khóa học

### 👨‍🏫 Giảng viên
- Tạo và quản lý khóa học, section, bài học (text / video / quiz)
- Upload video qua Cloudinary hoặc GridFS
- Chấm điểm bài tập, theo dõi thống kê học viên và doanh thu

### 🛡️ Quản trị viên
- Duyệt giảng viên, khóa học và đánh giá
- Quản lý mã giảm giá, thanh toán và hoàn tiền
- Xem analytics toàn hệ thống

---

## 🛠️ Công nghệ sử dụng

| Tầng | Công nghệ |
|------|-----------|
| **Backend** | Node.js 18+, Express.js, MongoDB (Mongoose) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **Auth** | JWT (access + refresh token), OTP email |
| **Real-time** | Socket.IO |
| **Lưu trữ** | Cloudinary (ảnh/video), GridFS (fallback) |
| **Email** | Resend |
| **Thanh toán** | VNPay, MoMo, ZaloPay, Chuyển khoản ngân hàng |
| **Bảo mật** | Helmet, CORS, Rate limiting, Input validation |

---

## 🚀 Chạy nhanh

### 1. Cài đặt

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Cấu hình môi trường

```bash
cp backend/.env.example backend/.env    # Điền MONGODB_URI, JWT_SECRET, CORS_ORIGIN, ...
cp frontend/.env.example frontend/.env  # Điền VITE_API_URL=http://localhost:5000
```

### 3. Khởi động

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

- **Frontend:** http://localhost:5173  
- **Backend API:** http://localhost:5000  
- **Swagger docs:** http://localhost:5000/api-docs *(development only)*

---

## 🔐 Bảo mật

- JWT + Role-based access control (Student / Instructor / Admin)
- Email OTP verification
- Helmet, CORS, Rate limiting
- Không lưu thông tin nhạy cảm trong code (dùng biến môi trường)

---

## 📁 Cấu trúc dự án

```
E-Learning/
├── backend/   # Node.js API — controllers, models, routes, services
└── frontend/  # React SPA — pages (~55), components, hooks, services
```

---

## ⚙️ CI/CD

GitHub Actions tự động chạy:
- **Backend:** `npm ci` + `npm test`
- **Frontend:** `npm ci` + `npm run build`
