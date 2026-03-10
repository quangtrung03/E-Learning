# DOCS — E-Learning Platform

Tài liệu này tập trung vào:
- Cấu hình dịch vụ (Resend email, Cloudinary, DB)
- Các script seed/clean
- Audit nhanh các lỗi nghiêm trọng (root-cause + tác động + hướng khắc phục)

---

## 1) Setup nhanh

### Backend env
- Copy `backend/.env.example` → `backend/.env`
- Các biến quan trọng:
  - `MONGODB_URI`
  - `JWT_SECRET`, `JWT_EXPIRES_IN`
  - `FRONTEND_URL`
  - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Chạy backend:

```bash
cd backend
npm install
npm run dev
```

Swagger: http://localhost:5000/api-docs

### Frontend env
- Copy `frontend/.env.example` → `frontend/.env`
- Quan trọng nhất:
  - `VITE_API_URL=http://localhost:5000`

Chạy frontend:

```bash
cd frontend
npm install
npm run dev
```

---

## 2) Seed / Clean database

Các script nằm ở `backend/scripts/`.

### Clean database

```bash
cd backend
npm run db:clean
```

### Seed rich (seed “hết đi”)

```bash
cd backend
npm run seed:rich
```

### Seed rich + reset (xóa & seed lại)

```bash
cd backend
npm run seed:rich:reset
```

### Seed rich + reset + purge Cloudinary (ảnh/video theo prefix)

```bash
cd backend
npm run seed:rich:reset:cloudinary
```

---

## 3) Cloudinary purge an toàn

Script purge theo prefix để tránh xóa nhầm toàn bộ asset.

```bash
cd backend
npm run cloudinary:purge:elearning:confirm
```

- Mặc định chỉ xóa prefix `elearning/` khi có `CLOUDINARY_PURGE_CONFIRM=YES`.
- Chế độ cho production phải bật thêm `CLOUDINARY_PURGE_ALLOW_PROD=YES`.

---

## 4) AUDIT — Lỗi nghiêm trọng (theo flow)

> Mục tiêu: liệt kê các lỗi có thể gây “trắng trang”, kẹt flow, hoặc sai dữ liệu nghiêm trọng trong production.

### 4.1 Frontend — Trắng trang runtime do truy cập field không tồn tại

**Triệu chứng**
- Production blank page.
- Console: `TypeError: Cannot read properties of undefined (reading 'toFixed')`.

**Root cause**
- UI assume `course.rating.average` luôn tồn tại và gọi `.toFixed(1)`.
- Với dữ liệu cũ/không đầy đủ, `rating` hoặc `average` có thể thiếu → crash ngay khi render.

**Đã xử lý**
- Dùng optional chaining + fallback cho rating.

**Files đã vá**
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Courses.tsx`
- `frontend/src/pages/InstructorProfile.tsx`

**Khuyến nghị**
- Với mọi field nested từ API, render phải có fallback để tránh “white screen”.

---

### 4.2 Backend — Email verify “log OK nhưng không có email” (Resend SDK)

**Triệu chứng**
- Log báo gửi email thành công nhưng thực tế user không nhận.

**Root cause**
- Resend SDK thường trả về `{ data, error }` và *không throw*.
- Code trước đây chỉ log “sent” dù `error` tồn tại hoặc `data.id` rỗng.

**Đã xử lý**
- Treat `error` hoặc missing `data.id` là failure; log structured result.

**Files đã vá**
- `backend/src/config/email-new.js`
- `backend/src/services/notificationService.js`

---

### 4.3 Backend — Flow resend verification bị “tự khóa” user mới đăng ký

**Triệu chứng**
- User đăng ký xong (email chưa verify) không thể login.
- Nếu email không tới, user cần “resend verification” nhưng endpoint lại yêu cầu JWT.
- Register endpoint không trả JWT → user không thể gọi resend.

**Root cause**
- Route `POST /api/auth/resend-verification` gắn `protectWithoutEmailVerification` dù controller ghi `@access Public`.

**Đã xử lý**
- Route resend verification đã chuyển thành public + rate limit.
- Response đã được làm “non-enumerating” (trả 200 generic) để tránh lộ email tồn tại/đã verify.

**Files đã vá**
- `backend/src/routes/authRoutes.js`
- `backend/src/controllers/authController.js` (hành vi response + log)

---

### 4.4 Backend — Lộ token/OTP qua server logs (rủi ro bảo mật)

**Triệu chứng**
- Log in ra token/OTP ở nhiều flow: register, resend verify, verify email, forgot/reset password.

**Tác động**
- Nếu log production bị lộ, attacker có thể dùng token/OTP để takeover account.

**Đã xử lý**
- Chỉ log token/OTP khi `NODE_ENV !== 'production'`.

**Files đã vá**
- `backend/src/controllers/authController.js`

---

### 4.5 Backend → Frontend — Virtuals bị mất khi dùng `.lean()` (finalPrice)

**Triệu chứng**
- Một số API trả về course data thiếu `finalPrice` (vì là virtual).
- Frontend/analytics có thể tính sai doanh thu hoặc hiển thị sai.

**Root cause**
- Mongoose `.lean()` trả plain object và **không** include virtuals.

**Đã xử lý (một phần)**
- Các endpoint dùng `.lean()` đã bổ sung `finalPrice` thủ công khi cần.

**Khuyến nghị**
- Chuẩn hóa: nơi nào dùng `.lean()` mà client cần virtuals → map bổ sung hoặc bỏ `.lean()`.

---

### 4.6 API Response shape không chuẩn hóa (tăng rủi ro crash/bug UI)

**Quan sát**
- Có endpoint trả `data: []` (ví dụ categories), có endpoint trả `data: { courses: [] }`.
- Frontend phải viết parsing phòng thủ (nơi có, nơi không), dễ bỏ sót.

**Ví dụ**
- `backend/src/controllers/categoryController.js` trả `data: categories`.
- Nhiều endpoint course/dashboard trả `data: { courses }`.

**Khuyến nghị**
- Chọn 1 chuẩn duy nhất: luôn `data: { ... }`.
- Tạo helper ở backend để trả response đồng nhất.

---

## 5) Gợi ý check nhanh trước deploy

- `backend`: `npm run test` (nếu có)
- `frontend`: `npm run build`
- Nếu Vercel trắng trang: mở DevTools console tìm stacktrace runtime.
