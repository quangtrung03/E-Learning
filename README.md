# E-Learning Platform

Nền tảng LMS (Learning Management System) full-stack với quản lý khóa học, bài học, bài tập, thanh toán, chứng chỉ và phân tích học tập.

## Tổng quan

- **Kiến trúc:** Monorepo gồm backend API (Node.js/Express) và frontend web app (React/TypeScript).
- **Mục tiêu:** Hỗ trợ dạy/học trực tuyến cho 3 vai trò: Học viên (Student), Giảng viên (Instructor), Quản trị viên (Admin).
- **Trạng thái:** Core features hoàn thiện, sẵn sàng vận hành, có tài liệu QA và CI.

## Tài liệu liên quan

- [PROJECT_STATUS.md](./PROJECT_STATUS.md): Tình trạng tính năng, roadmap và tổng kết tiến độ.
- [DOCS.md](./DOCS.md): Hướng dẫn setup dịch vụ, seed/clean dữ liệu, audit các lỗi nghiêm trọng.
- [QA_TEST_FLOWS.md](./QA_TEST_FLOWS.md): Bộ kịch bản test end-to-end theo role và module.

## Tính năng chính

### Học viên (Student)
- Tìm kiếm và đăng ký khóa học, áp dụng mã giảm giá khi thanh toán
- Xem bài giảng video, làm bài tập (trắc nghiệm, tự luận, dự án, lập trình)
- Theo dõi tiến độ học tập, đặt mục tiêu học tập
- Tham gia thảo luận, nhóm học, nhắn tin với giảng viên
- Nhận chứng chỉ khi hoàn thành khóa học
- Lịch học cá nhân, lịch sử thanh toán

### Giảng viên (Instructor)
- Tạo và quản lý khóa học, section, bài học (text/video/quiz)
- Upload video qua Cloudinary hoặc GridFS
- Quản lý học viên, bài tập và kết quả chấm điểm
- Theo dõi thống kê khóa học và doanh thu
- Tham gia thảo luận, giải đáp câu hỏi học viên

### Quản trị viên (Admin)
- Quản trị người dùng (duyệt giảng viên, khóa tài khoản)
- Duyệt/từ chối khóa học và đánh giá
- Quản lý mã giảm giá (tạo, sửa, bật/tắt, xóa)
- Quản lý thanh toán và hoàn tiền
- Theo dõi analytics toàn hệ thống

## Tech stack

### Backend
- **Runtime:** Node.js 18+, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (access + refresh token), email OTP
- **Validation:** express-validator, helmet, cors, rate limiting
- **API Docs:** Swagger (development mode)
- **Real-time:** Socket.IO
- **Storage:** Cloudinary (ảnh/video), GridFS (local fallback)
- **Email:** Resend
- **Payment:** VNPay, MoMo, ZaloPay, Chuyển khoản ngân hàng (mô phỏng)

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Routing:** React Router v6
- **UI:** Tailwind CSS, Framer Motion
- **HTTP:** Axios
- **Real-time:** Socket.IO client
- **Monitoring:** Sentry (tùy chọn)

## Cấu trúc dự án

```text
E-Learning/
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình DB, Cloudinary, email
│   │   ├── controllers/     # Logic xử lý API
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # Định nghĩa route
│   │   ├── services/        # Email, Socket.IO service
│   │   ├── utils/           # Helper functions
│   │   └── server.js        # Entry point
│   ├── scripts/             # Seed, clean, purge scripts
│   ├── tests/               # Jest test files
│   └── uploads/             # GridFS upload temp
├── frontend/
│   ├── src/
│   │   ├── components/      # Shared UI components
│   │   ├── context/         # React context (Auth, Toast)
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components (~55 pages)
│   │   ├── services/        # API service calls
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helper utilities
│   └── public/              # Static assets
├── DOCS.md
├── PROJECT_STATUS.md
├── QA_TEST_FLOWS.md
└── README.md
```

## Yêu cầu hệ thống

- Node.js 18+ (CI đang chạy Node.js 20)
- npm
- MongoDB local hoặc MongoDB Atlas

## Chạy nhanh local

### 1) Cài đặt dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Tạo file env

**Backend** — copy `backend/.env.example` thành `backend/.env` và điền:

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `MONGODB_URI` | ✅ | Chuỗi kết nối MongoDB |
| `JWT_SECRET` | ✅ | Secret key cho JWT (≥32 ký tự) |
| `JWT_REFRESH_SECRET` | ✅ | Secret key cho refresh token |
| `CORS_ORIGIN` | ✅ | URL frontend (vd: `http://localhost:5173`) |
| `FRONTEND_URL` | ✅ | URL frontend (dùng cho redirect, email link) |
| `RESEND_API_KEY` | Email | API key từ [resend.com](https://resend.com) |
| `CLOUDINARY_*` | Upload | Thông tin Cloudinary |
| `BANK_NAME` | Thanh toán | Tên ngân hàng chuyển khoản |
| `BANK_ACCOUNT_NUMBER` | Thanh toán | Số tài khoản nhận tiền |
| `BANK_ACCOUNT_NAME` | Thanh toán | Tên chủ tài khoản |

**Frontend** — copy `frontend/.env.example` thành `frontend/.env` và điền:

```
VITE_API_URL=http://localhost:5000
```

### 3) Chạy ứng dụng

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Mặc định:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000
- **Healthcheck:** http://localhost:5000/api/health
- **Swagger** (chỉ development): http://localhost:5000/api-docs

## Biến môi trường

### Backend

| Nhóm | Biến | Mô tả |
|------|------|-------|
| **Server** | `PORT`, `NODE_ENV` | Cổng (mặc định 5000), môi trường |
| **Database** | `MONGODB_URI` | Chuỗi kết nối MongoDB |
| **Auth** | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRE` | JWT config |
| **CORS** | `CORS_ORIGIN`, `FRONTEND_URL` | Phải khớp với URL frontend |
| **Email** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Resend email service |
| **Cloudinary** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Lưu trữ ảnh/video |
| **Bank** | `BANK_NAME`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_NAME` | Thông tin nhận chuyển khoản |
| **VNPay** | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_URL`, `VNPAY_RETURN_URL`, `VNPAY_IPN_URL` | VNPay gateway |
| **MoMo** | `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_ENDPOINT`, `MOMO_RETURN_URL`, `MOMO_IPN_URL` | MoMo gateway |
| **Stripe** | `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe gateway |
| **Cron** | `ENABLE_CRON` | Bật/tắt cron jobs |
| **Dev** | `SWAGGER_ENABLED`, `DEBUG_MODE`, `LOG_LEVEL` | Công cụ phát triển |
| **Monitoring** | `SENTRY_DSN` | Sentry error tracking |

### Frontend

| Biến | Mô tả |
|------|-------|
| `VITE_API_URL` | URL backend API (bắt buộc) |
| `VITE_NODE_ENV` | Môi trường |
| `VITE_APP_URL` | URL app |
| `VITE_APP_NAME` | Tên app |
| `VITE_APP_VERSION` | Version |
| `VITE_SENTRY_DSN` | Sentry DSN (tùy chọn) |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Sentry sample rate (tùy chọn) |

## NPM scripts chính

### Backend

```bash
npm run dev                         # Chạy development với nodemon
npm run dev:cron                    # Chạy với cron jobs
npm run start                       # Production
npm run test                        # Chạy Jest tests
npm run db:clean                    # Xóa toàn bộ dữ liệu
npm run seed                        # Seed dữ liệu mẫu cơ bản
npm run seed:demo                   # Seed demo nhẹ
npm run seed:rich                   # Seed dữ liệu phong phú
npm run seed:oer:university         # Seed khóa học OER đại học
npm run seed:rich:reset             # Reset + seed lại
npm run seed:rich:reset:cloudinary  # Reset + seed + đồng bộ Cloudinary
npm run cloudinary:purge:elearning:confirm  # Xóa assets Cloudinary theo prefix
```

### Frontend

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run preview  # Preview build
npm run lint     # Kiểm tra lỗi lint
```

## Luồng thanh toán

Hệ thống hỗ trợ 4 phương thức:

| Phương thức | Trạng thái | Mô tả |
|-------------|-----------|-------|
| **VNPay** | Mô phỏng | Redirect sang trang giả lập, admin duyệt |
| **MoMo** | Mô phỏng | Redirect sang trang giả lập, admin duyệt |
| **ZaloPay** | Mô phỏng | Redirect sang trang giả lập, admin duyệt |
| **Chuyển khoản** | Hoạt động | Tạo yêu cầu offline, admin duyệt thủ công |

**Lưu ý:** Để tích hợp cổng thanh toán thật, điền các biến môi trường tương ứng (VNPay/MoMo) và bỏ comment phần xử lý trong `paymentController.js`.

Checkout hỗ trợ nhập **mã giảm giá (coupon)** trực tiếp trên trang thanh toán.

## API modules

| Prefix | Chức năng |
|--------|----------|
| `/api/auth` | Đăng ký, đăng nhập, OTP, refresh token |
| `/api/courses` | CRUD khóa học, tìm kiếm, lọc |
| `/api/lessons` | CRUD bài học, video upload |
| `/api/sections` | Quản lý sections trong khóa học |
| `/api/assignments` | Bài tập, nộp bài, chấm điểm |
| `/api/certificates` | Cấp và xác minh chứng chỉ |
| `/api/payments` | Tạo thanh toán, lịch sử, hoàn tiền |
| `/api/coupons` | Quản lý và xác thực mã giảm giá |
| `/api/analytics` | Phân tích học tập và doanh thu |
| `/api/discussions` | Diễn đàn thảo luận theo khóa học |
| `/api/reviews` | Đánh giá khóa học |
| `/api/study-groups` | Nhóm học, lịch học nhóm |
| `/api/messages` | Nhắn tin real-time |
| `/api/friends` | Kết bạn |
| `/api/social` | Feed xã hội |
| `/api/search` | Tìm kiếm toàn hệ thống |
| `/api/schedule` | Lịch học cá nhân |
| `/api/categories` | Danh mục khóa học |
| `/api/instructors` | Thông tin giảng viên |
| `/api/testimonials` | Đánh giá nền tảng |
| `/api/settings` | Cài đặt hệ thống |
| `/api/upload` | Upload file |
| `/api/admin` | Quản trị hệ thống |

> Webhook thanh toán: `/api/payments/webhook/:provider`  
> Swagger docs chỉ mở trong development mode.

## Seed/Clean dữ liệu

Tất cả scripts nằm ở `backend/scripts`.

```bash
cd backend

# Xóa và seed lại dữ liệu phong phú
npm run seed:rich:reset

# Nếu cần reset + đồng bộ Cloudinary theo prefix elearning/
npm run seed:rich:reset:cloudinary
```

## Cloudinary purge an toàn

```bash
cd backend
npm run cloudinary:purge:elearning:confirm
```

> Yêu cầu xác nhận qua biến môi trường trong script. Production purge cần cơ chế cho phép riêng.

## CI/CD

GitHub Actions với 2 jobs:
- **Backend tests:** `npm ci` + `npm test`
- **Frontend build:** `npm ci` + `npm run build`

Workflow: `.github/workflows/ci.yml`

## QA và kiểm thử

Sử dụng [QA_TEST_FLOWS.md](./QA_TEST_FLOWS.md) để chạy test theo:
- Smoke test
- Auth (đăng ký, đăng nhập, OTP, đổi mật khẩu)
- Profile & Upload
- Course/Lesson/Assignment
- Discussion/Review
- Payment flow (bao gồm mã giảm giá)
- Admin moderation

## Production notes

- Backend cần `app.set('trust proxy', 1)` khi deploy sau reverse proxy.
- Đặt `LOG_LEVEL=info` nếu cần structured access logs (JSON).
- Khuyến nghị bật Sentry ở backend/frontend để theo dõi lỗi runtime.
- Frontend đã có `vercel.json` cho SPA rewrite về `index.html`.

## Bảo mật

- JWT auth + role-based access control
- Email verification (OTP)
- Input validation & sanitization
- Helmet + CORS
- Rate limiting
- Tập trung error handling + request id tracing
- Không lưu thông tin nhạy cảm trong code (dùng biến môi trường)

## Troubleshooting nhanh

| Lỗi | Cách kiểm tra |
|-----|--------------|
| CORS lỗi | Kiểm tra `CORS_ORIGIN` và `FRONTEND_URL` trong backend `.env` |
| Frontend gọi sai API | Kiểm tra `VITE_API_URL` trong frontend `.env` |
| Swagger không hiển thị | Đảm bảo `NODE_ENV=development` |
| Upload fail | Kiểm tra thông tin Cloudinary |
| Payment callback fail | Kiểm tra `VNPAY_IPN_URL`/`MOMO_IPN_URL`/`BACKEND_PUBLIC_URL` |
| Email không gửi | Kiểm tra `RESEND_API_KEY` và domain đã verify trên Resend |
| MongoDB không kết nối | Kiểm tra IP whitelist trên Atlas, đúng `MONGODB_URI` |

## Đóng góp

1. Tạo branch mới từ `main`.
2. Commit theo scope rõ ràng (`backend/`, `frontend/`, `docs/`).
3. Tạo pull request kèm mô tả thay đổi và cách test.

## Ghi chú

- Tài liệu này được cập nhật dựa trên codebase hiện tại.
- Nếu có thay đổi route, env hoặc scripts, hãy cập nhật README, DOCS và QA_TEST_FLOWS đồng bộ.
