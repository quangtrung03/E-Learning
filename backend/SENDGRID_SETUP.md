# Hướng dẫn thiết lập SendGrid để gửi email

## 1. Tạo tài khoản SendGrid
1. Đăng ký tài khoản tại https://sendgrid.com
2. Xác thực email và số điện thoại

## 2. Tạo API Key
1. Vào Dashboard > Settings > API Keys
2. Click "Create API Key"
3. Chọn "Full Access" hoặc "Restricted Access" (cho phép Mail Send)
4. Copy API Key (chỉ hiện 1 lần!)

## 3. Verify Sender Email
1. Vào Dashboard > Settings > Sender Authentication
2. Chọn "Verify a Single Sender"
3. Nhập thông tin email gửi (ví dụ: noreply@yourdomain.com)
4. SendGrid sẽ gửi email xác thực, click link để verify

## 4. Cấu hình biến môi trường trên Render
Trong Dashboard Render > Service > Environment:
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

## 5. Test gửi email
Sau khi deploy, thử đăng ký tài khoản mới để kiểm tra email xác thực.

## Lưu ý:
- SendGrid có 100 email miễn phí/ngày đủ cho development
- Nếu dùng domain riêng, cần verify domain thay vì single sender
- Không cần cấu hình SMTP, SendGrid dùng HTTPS API