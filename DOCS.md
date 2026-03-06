# 📚 DOCS — E‑Learning

**Last Updated:** 04/03/2026

Tài liệu được gom lại để **giảm số file** và tránh link chết.

---

## ✅ Đọc gì trước?

- Setup & chạy dự án: [README.md](./README.md)
- Tình trạng dự án / tính năng: [PROJECT_STATUS.md](./PROJECT_STATUS.md)
- Kịch bản test toàn hệ thống (QA flows): [QA_TEST_FLOWS.md](./QA_TEST_FLOWS.md)
- API docs (Swagger): http://localhost:5000/api-docs

---

## 🚀 Workflow dev nhanh (Windows/PowerShell)

```powershell
# Backend
cd backend
copy .env.example .env
npm install
npm run dev

# Frontend (mở terminal khác)
cd ..\frontend
copy .env.example .env
npm install
npm run dev
```

Endpoints:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Swagger: http://localhost:5000/api-docs

---

## 📧 Email setup (Resend)

Backend hiện dùng **Resend** để gửi email (xác thực email OTP/link, quên mật khẩu, thông báo…). Cấu hình nằm ở `backend/src/config/email-new.js` và một phần ở `backend/src/services/notificationService.js`.

### 1) Tạo API key trên Resend

- Tạo tài khoản: https://resend.com/
- Tạo API key (thường bắt đầu bằng `re_`)

> Production: nên dùng domain đã verify để tránh vào spam.

### 2) Cấu hình môi trường

Tạo/cập nhật `backend/.env` (có thể copy từ `backend/.env.example`):

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=E-Learning Platform <onboarding@resend.dev>

# Dùng để build link trong email (verify/reset…)
FRONTEND_URL=http://localhost:5173

# CORS (backend)
CORS_ORIGIN=http://localhost:5173
```

Nếu deploy (Render), set các biến trên trong Environment Variables.

### 3) Kiểm tra nhanh

```bash
cd backend
npm run dev
```

Khi `RESEND_API_KEY` đúng, backend sẽ log kiểu “Resend email service initialized”. Nếu thiếu key, hệ thống sẽ cảnh báo và tự disable email (không crash).

### 4) Troubleshooting

- Không gửi được email / log cảnh báo thiếu key
  - Kiểm tra `RESEND_API_KEY` đã set chưa
  - Kiểm tra key có bắt đầu bằng `re_`
- Link trong email trỏ sai domain
  - Set `FRONTEND_URL` đúng với môi trường (local / production)
- Dev muốn đi nhanh, không muốn gửi email
  - Có thể tạm thời set `emailVerified: true` cho user trong DB để bypass verify khi test thủ công

---

## 🖼️ Cloudinary setup (image storage)

### Tại sao cần Cloudinary?

Files trong `uploads/` trên máy local **không phù hợp production** (ephemeral filesystem trên Render/Vercel). Giải pháp: upload ảnh lên **Cloudinary** để lấy URL CDN ổn định.

### Hướng dẫn setup

1) Tạo tài khoản Cloudinary (free): https://cloudinary.com/users/register_free

2) Lấy credentials trong dashboard: https://console.cloudinary.com/

3) Thêm vào `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=dxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4) Verify nhanh

- Khi upload qua các endpoint `/api/upload/*`, backend trả về URL Cloudinary (HTTPS).
- Frontend chỉ cần lưu URL đó vào profile/course/lesson (không dùng path local `uploads/` trong production).

---

## 🗂️ Cloudinary folder tách biệt theo mục đích (avatar / course / default thumbnail / attachments)

Hệ thống đã chuẩn hoá upload theo **"type"** để các file vào đúng folder, dễ quản lý.

### 1) Upload API chuẩn (khuyến nghị dùng)

- `POST /api/upload/image?type=...`
- `POST /api/upload/video?type=...`
- `POST /api/upload/audio?type=...`
- `POST /api/upload/document?type=...`

Frontend truyền `type` (query param) để backend route vào đúng folder.

### 2) Mapping `type` → Cloudinary folder

Tất cả nằm dưới root: `elearning/...`

- Avatar
  - `type=avatar` → `elearning/avatars`

- Course thumbnails
  - `type=course_thumbnail` → `elearning/course-thumbnails`

- Default course thumbnails (admin quản lý)
  - `type=default_course_thumbnail` → `elearning/defaults/course-thumbnails`

- Lesson videos
  - `type=lesson_video` → `elearning/lesson-videos`

- Lesson resources
  - `type=lesson_resource_image` → `elearning/lesson-resources/images`
  - `type=lesson_resource_document` → `elearning/lesson-resources/documents`

- Message attachments
  - `type=message_attachment_image` → `elearning/message-attachments/images`
  - `type=message_attachment_document` → `elearning/message-attachments/documents`

Nếu không truyền `type` hoặc `type` không khớp, backend sẽ đưa vào `elearning/uploads/...` theo resource.

### 3) Endpoint upload theo entity (vẫn tồn tại)

- `POST /api/courses/:id/upload-thumbnail` → `elearning/course-thumbnails`
- `POST /api/lessons/:id/upload-video` → `elearning/lesson-videos`
- `POST /api/lessons/:id/upload-document` → `elearning/lesson-resources/documents`

---

## 🧹 Reset DB + dọn Cloudinary + seed dữ liệu demo (an toàn)

Các lệnh dưới đây **có tính phá huỷ dữ liệu**.

### 1) Dọn Cloudinary theo prefix `elearning/` (khuyến nghị)

Script này chỉ cho phép xoá trong prefix bắt đầu bằng `elearning/`.

```powershell
cd backend

# Xoá toàn bộ assets dưới elearning/ (image/video/raw) (Windows-friendly)
npm run cloudinary:purge:elearning:confirm
```

Nếu terminal báo `NODE_ENV=production detected. Refusing to purge`, dùng script explicit cho production:

```powershell
cd backend
npm run cloudinary:purge:elearning:prod
```

Nếu bạn đang chạy với `NODE_ENV=production`, script sẽ từ chối trừ khi thêm `--allow-production`.

### 2) Reset DB + seed rich

Seed rich tạo:
- Admin/Instructor/Students
- Categories, Instructor landing list
- Courses + Lessons
- CourseSections (gán lesson vào section)
- Enrollments + Payments (để Dashboard + Revenue hiển thị đúng)
- Assignments + Submissions (bài quiz + mini project)
- Reviews (và cập nhật `course.rating`)
- Discussions
- Chat demo: Conversations + Messages
- StudyGroups
- LearningAnalytics
- Certificates (cho một số enrollment completed)
- Coupons
- FriendRequests + Friendships
- AppSetting `courseThumbnails` (default thumbnail do admin quản lý)

```powershell
cd backend

# Reset toàn bộ collections rồi seed
npm run seed:rich:reset

# Seed + upload thumbnails (SVG tự tạo) lên Cloudinary
npm run seed:rich:reset:cloudinary
```

### 3) Seed video lessons (tuỳ chọn)

Để seed video đúng luật bản quyền, ưu tiên URL video hợp lệ (CC0 / public domain) qua biến môi trường `SEED_VIDEO_URLS` (phân tách bằng dấu phẩy). Nếu không cung cấp, script sẽ dùng video mẫu **CC0** mặc định từ `cc0-videos` của MDN (nhỏ, phù hợp demo) và cố gắng upload vào Cloudinary.

```powershell
cd backend

$env:SEED_VIDEO_URLS="https://.../video1.mp4,https://.../video2.mp4"
npm run seed:rich:reset:cloudinary
```

Khuyến nghị: frontend nên dùng `/api/upload/*` để nhất quán.

---

## 🖼️ Default thumbnail (admin quản lý)

### Public

- `GET /api/settings/default-course-thumbnail`
  - Trả về URL thumbnail mặc định đang active (hoặc `null`)

### Admin

- `GET /api/admin/settings/course-thumbnails` (list)
- `POST /api/admin/settings/course-thumbnails` (add)
- `PUT /api/admin/settings/course-thumbnails/active` (set active)
- `DELETE /api/admin/settings/course-thumbnails` (remove)

### Frontend

- Trang admin: `/admin/settings/thumbnails`
- Các card khóa học sẽ ưu tiên `course.thumbnail`, nếu thiếu thì fallback sang default thumbnail (public settings).

### Production deployment

- Render: set 3 biến `CLOUDINARY_*` trong Environment Variables
- Vercel (nếu cần): set tương tự

### Troubleshooting

- “Must supply cloud_name” → thiếu `CLOUDINARY_CLOUD_NAME` trong `.env`
- “Invalid credentials” → sai API key/secret
- Ảnh không hiển thị → kiểm tra `imageUrl` trong DB đã là Cloudinary URL chưa

References:
- Cloudinary Docs: https://cloudinary.com/documentation
- Node.js SDK: https://cloudinary.com/documentation/node_integration
