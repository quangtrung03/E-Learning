# E-Learning Platform

Nen tang LMS full-stack voi quan ly khoa hoc, bai hoc, bai tap, thanh toan, chung chi va phan tich hoc tap.

## Tong quan

- Kien truc: Monorepo gom backend API va frontend web app.
- Muc tieu: Ho tro day/hoc truc tuyen cho 3 vai tro Student, Instructor, Admin.
- Trang thai: Core features san sang van hanh, co tai lieu QA va CI.

## Tai lieu lien quan

- PROJECT_STATUS.md: Tinh trang tinh nang, roadmap va tong ket tien do.
- DOCS.md: Huong dan setup dich vu, seed/clean du lieu, audit cac loi nghiem trong.
- QA_TEST_FLOWS.md: Bo kich ban test end-to-end theo role va module.

## Tech stack

### Backend

- Node.js, Express.js
- MongoDB, Mongoose
- JWT auth, express-validator, helmet, cors, rate limiting
- Swagger (dev), Socket.IO
- Cloudinary, Resend
- Payment gateways: Stripe, VNPay, MoMo

### Frontend

- React + TypeScript + Vite
- React Router
- Tailwind CSS
- Axios, Socket.IO client
- Sentry (optional)

## Cau truc du an

```text
E-Learning/
|- backend/
|  |- src/
|  |  |- config/
|  |  |- controllers/
|  |  |- middleware/
|  |  |- models/
|  |  |- routes/
|  |  |- services/
|  |  |- utils/
|  |  \- server.js
|  |- scripts/
|  |- tests/
|  \- uploads/
|- frontend/
|  |- src/
|  |  |- components/
|  |  |- context/
|  |  |- hooks/
|  |  |- pages/
|  |  |- services/
|  |  |- types/
|  |  \- utils/
|  \- public/
|- DOCS.md
|- PROJECT_STATUS.md
|- QA_TEST_FLOWS.md
\- README.md
```

## Yeu cau he thong

- Node.js 18+ (CI dang chay Node.js 20)
- npm
- MongoDB local hoac MongoDB Atlas

## Chay nhanh local

### 1) Cai dat dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Tao file env

Backend:

- Copy backend/.env.example thanh backend/.env
- Dien cac bien bat buoc (toi thieu):
  - MONGODB_URI
  - JWT_SECRET
  - JWT_REFRESH_SECRET
  - CORS_ORIGIN
  - FRONTEND_URL

Frontend:

- Copy frontend/.env.example thanh frontend/.env
- Dien toi thieu:
  - VITE_API_URL=http://localhost:5000

### 3) Chay ung dung

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Mac dinh:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Healthcheck: http://localhost:5000/api/health
- Swagger (chi o development): http://localhost:5000/api-docs

## Bien moi truong quan trong

### Backend

- Core: PORT, NODE_ENV, MONGODB_URI
- Auth: JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRE
- CORS/URL: CORS_ORIGIN, FRONTEND_URL
- Email: RESEND_API_KEY, RESEND_FROM_EMAIL
- Cloudinary: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Payments:
  - Stripe: STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  - VNPay: VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL, VNPAY_RETURN_URL, VNPAY_IPN_URL
  - MoMo: MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY, MOMO_ENDPOINT, MOMO_RETURN_URL, MOMO_IPN_URL
- Observability: LOG_LEVEL, SENTRY_DSN
- Feature flags: ENABLE_CRON, SWAGGER_ENABLED, DEBUG_MODE

### Frontend

- VITE_API_URL
- VITE_NODE_ENV
- VITE_APP_URL
- VITE_APP_NAME
- VITE_APP_VERSION
- VITE_SENTRY_DSN (optional)
- VITE_SENTRY_TRACES_SAMPLE_RATE (optional)

## NPM scripts chinh

### Backend

```bash
npm run dev
npm run dev:cron
npm run start
npm run test
npm run db:clean
npm run seed
npm run seed:demo
npm run seed:rich
npm run seed:oer:university
npm run seed:rich:reset
npm run seed:rich:reset:cloudinary
npm run cloudinary:purge:elearning:confirm
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## API modules (theo route prefix)

- /api/auth
- /api/courses
- /api/lessons
- /api/assignments
- /api/certificates
- /api/upload
- /api/settings
- /api/payments
- /api/coupons
- /api/discussions
- /api/reviews
- /api/study-groups
- /api/analytics
- /api/messages
- /api/friends
- /api/sections
- /api/social
- /api/search
- /api/schedule
- /api/categories
- /api/instructors
- /api/testimonials
- /api/admin

Luu y:

- Webhook thanh toan: /api/payments/webhook/:provider
- Swagger docs chi mo trong development mode.

## Vai tro he thong

### Student

- Tim kiem va dang ky khoa hoc
- Hoc bai, lam bai tap, theo doi tien do
- Tham gia thao luan, nhom hoc, nhan chung chi

### Instructor

- Tao va quan ly khoa hoc/lesson/section
- Quan ly hoc vien, bai tap va ket qua
- Theo doi thong ke khoa hoc/doanh thu

### Admin

- Quan tri user, khoa hoc, review, coupon
- Dieu phoi duyet noi dung
- Theo doi analytics he thong

## Seed/Clean du lieu

Tat ca scripts nam o backend/scripts.

```bash
cd backend
npm run db:clean
npm run seed:rich
```

Neu can reset va seed lai:

```bash
npm run seed:rich:reset
```

Neu can reset + dong bo Cloudinary theo prefix elearning/:

```bash
npm run seed:rich:reset:cloudinary
```

## Cloudinary purge an toan

Project co script purge theo prefix de tranh xoa nham tai nguyen.

```bash
cd backend
npm run cloudinary:purge:elearning:confirm
```

Luu y:

- Yeu cau xac nhan qua bien moi truong trong script.
- Production purge can co co cho phep rieng.

## CI/CD

GitHub Actions dang co 2 jobs:

- Backend tests: npm ci + npm test
- Frontend build: npm ci + npm run build

Workflow: .github/workflows/ci.yml

## QA va kiem thu

Su dung QA_TEST_FLOWS.md de chay test theo:

- Smoke test
- Auth
- Profile/Upload
- Course/Lesson/Assignment
- Discussion/Review
- Payment flow
- Admin moderation

## Production notes

- Backend can app.set('trust proxy', 1) khi deploy sau reverse proxy.
- Dat LOG_LEVEL=info neu can structured access logs.
- Khuyen nghi bat Sentry o backend/frontend de theo doi loi runtime.
- Frontend da co vercel.json cho SPA rewrite ve index.html.

## Bao mat

- JWT auth + role-based access
- Email verification
- Input validation
- Helmet + CORS
- Rate limiting
- Error handling tap trung + request id tracing

## Troubleshooting nhanh

- CORS loi: kiem tra CORS_ORIGIN va FRONTEND_URL trong backend env.
- Frontend goi sai API: kiem tra VITE_API_URL.
- Swagger khong hien thi: dam bao NODE_ENV=development.
- Upload fail: kiem tra thong tin Cloudinary.
- Payment callback fail: kiem tra VNPAY_IPN_URL/MOMO_IPN_URL/BACKEND_PUBLIC_URL.

## Dong gop

1. Tao branch moi tu main/master.
2. Commit theo scope ro rang (backend/frontend/docs).
3. Tao pull request kem mo ta thay doi va cach test.

## Ghi chu

- Tai lieu nay duoc cap nhat dua tren codebase hien tai.
- Neu co thay doi route, env hoac scripts, hay cap nhat README, DOCS va QA_TEST_FLOWS dong bo.
