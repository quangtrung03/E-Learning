# 🖼️ CLOUDINARY SETUP - Image Storage for Production

## Tại sao cần Cloudinary?

**VẤN ĐỀ:** Files trong `uploads/` folder trên máy local **KHÔNG THỂ** hiển thị trên production vì:
- ❌ Render/Vercel có **ephemeral filesystem** (file sẽ mất khi restart)
- ❌ Không thể lưu trữ files lâu dài trên server
- ❌ URL `/uploads/image.jpg` sẽ trả về **404 Not Found**

**GIẢI PHÁP:** Upload ảnh lên **Cloudinary** (Cloud Storage)
- ✅ Free tier: 25GB storage + 25GB bandwidth/tháng
- ✅ CDN toàn cầu - load nhanh
- ✅ Auto-optimize images (WebP, resize, quality)
- ✅ URL vĩnh viễn: `https://res.cloudinary.com/xxx/image.jpg`

---

## 📋 Hướng dẫn Setup

### Bước 1: Tạo tài khoản Cloudinary (FREE)

1. Truy cập: https://cloudinary.com/users/register_free
2. Đăng ký với email
3. Verify email và đăng nhập

### Bước 2: Lấy API credentials

1. Vào Dashboard: https://console.cloudinary.com/
2. Copy 3 thông tin:
   - **Cloud Name**: `dxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Bước 3: Cập nhật file `.env`

```env
# Thêm vào backend/.env
CLOUDINARY_CLOUD_NAME=dxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Bước 4: Upload ảnh lên Cloudinary

```bash
cd backend
node scripts/upload-to-cloudinary.js
```

**Kết quả:**
```
📤 Starting Cloudinary upload...
✅ Connected to MongoDB

📁 Uploading Category Images...
  ✅ web-development: https://res.cloudinary.com/xxx/elearning/categories/developweb.jpg
  💾 Updated database for web-development
  
👨‍🏫 Uploading Instructor Images...
  ✅ Trần Minh Huy: https://res.cloudinary.com/xxx/elearning/instructors/huy.png
  💾 Updated database for Trần Minh Huy

🎉 Cloudinary upload completed!
```

### Bước 5: Verify

Database sẽ tự động update:
```javascript
// TRƯỚC (local path - KHÔNG hoạt động trên production)
imageUrl: "/uploads/categories/developweb.jpg"

// SAU (Cloudinary URL - hoạt động ВЕЗДЕ)
imageUrl: "https://res.cloudinary.com/xxx/image/upload/v123/elearning/categories/developweb.jpg"
```

---

## 🚀 Production Deployment

### Render.com
1. Vào Dashboard → Environment → Environment Variables
2. Thêm 3 biến:
   ```
   CLOUDINARY_CLOUD_NAME=dxxxxx
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Vercel
1. Settings → Environment Variables
2. Add variables tương tự

---

## 🎯 Kết quả

**Development (Local):**
- ✅ Ảnh từ Cloudinary CDN
- ✅ Load nhanh qua CDN gần nhất

**Production (Render/Vercel):**
- ✅ Ảnh từ Cloudinary CDN
- ✅ Không cần thư mục uploads/
- ✅ Auto-optimize (WebP, resize)
- ✅ 100% hoạt động ổn định

---

## 📝 Notes

- **Free tier**: 25GB storage, 25GB bandwidth/tháng (đủ cho 10,000+ ảnh)
- **Auto-optimization**: Cloudinary tự động convert sang WebP, resize, compress
- **CDN global**: Load nhanh toàn cầu
- **Backup**: Có thể download lại tất cả ảnh bất cứ lúc nào

---

## 🔧 Troubleshooting

**Lỗi: "Must supply cloud_name"**
→ Check file `.env` đã có `CLOUDINARY_CLOUD_NAME`

**Lỗi: "Invalid credentials"**
→ Check lại API Key và API Secret

**Ảnh không hiển thị**
→ Check database đã update sang Cloudinary URL chưa:
```bash
node -e "require('dotenv').config(); const mongoose = require('mongoose'); const Category = require('./src/models/Category'); mongoose.connect(process.env.MONGODB_URI).then(async () => { const cat = await Category.findOne(); console.log(cat.imageUrl); process.exit(0); });"
```

---

## 📚 References

- Cloudinary Docs: https://cloudinary.com/documentation
- Node.js SDK: https://cloudinary.com/documentation/node_integration
