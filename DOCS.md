# 📚 DOCS — E‑Learning

**Last Updated:** 03/03/2026

Tài liệu được gom lại để **giảm số file** và tránh link chết.

---

## ✅ Đọc gì trước?

- Setup & chạy dự án: [README.md](./README.md)
- Tình trạng dự án / tính năng: [PROJECT_STATUS.md](./PROJECT_STATUS.md)
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

4) Upload ảnh lên Cloudinary (script):

```bash
cd backend
node scripts/upload-to-cloudinary.js
```

5) Verify: database sẽ update từ local path sang Cloudinary URL.

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
