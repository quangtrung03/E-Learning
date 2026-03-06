# ✅ QA_TEST_FLOWS — Tài liệu kiểm thử toàn bộ hệ thống E‑Learning

**Last Updated:** 04/03/2026

Tài liệu này là “kịch bản tổng hợp” để bạn **tự tay kiểm tra end‑to‑end** toàn hệ thống theo:
- **Vai trò**: Guest / User (Student) / Instructor / Admin
- **Module**: Auth, Course, Lesson, Upload, Payment, Discussion, Review, Messages, Study Groups, Analytics, Certificates, Coupons…

> Gợi ý cách dùng: bạn có thể tick (✅/❌) từng mục, ghi chú lỗi, và kèm ảnh/screen recording.

---

## 1) Phạm vi & tiêu chí PASS

### PASS tối thiểu (release‑ready)
- Không có lỗi chặn luồng chính: đăng nhập, xem khóa học, học bài, upload tài nguyên, thanh toán (hoặc giả lập), admin quản trị.
- UI không “vỡ layout”, không trắng trang, không loading vô hạn.
- Các upload quan trọng lên Cloudinary và URL hiển thị đúng sau refresh.
- Quyền truy cập đúng: User không vào được Admin.

### FAIL (cần sửa trước khi bàn giao)
- Crash/blank page, lỗi 500 khi thao tác phổ biến.
- Upload thành công nhưng UI không cập nhật / refresh mất dữ liệu.
- Rò rỉ quyền (User thấy chức năng Admin).

---

## 2) Chuẩn bị môi trường kiểm thử (Local)

### 2.1 Cài & chạy
- Backend:
  - `cd backend`
  - `copy .env.example .env`
  - `npm install`
  - `npm run dev`
- Frontend:
  - `cd frontend`
  - `copy .env.example .env`
  - `npm install`
  - `npm run dev`

### 2.2 URL kiểm thử
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Swagger: `http://localhost:5000/api-docs`
- Healthcheck: `http://localhost:5000/api/health`

### 2.3 Seed dữ liệu (khuyến nghị)
- Nếu muốn có dữ liệu để test nhanh:
  - `cd backend`
  - `npm run seed:demo` (nếu bạn đang dùng demo seed)
  - Hoặc `npm run seed`

> Nếu bạn không chắc seed nào là đúng cho DB hiện tại, hãy chọn 1 seed và giữ nguyên xuyên suốt vòng test để tránh “lệch dữ liệu”.

---

## 3) Ma trận vai trò (Role matrix)

### Guest (chưa đăng nhập)
- Xem Home, danh sách khóa học, chi tiết khóa học.
- Đăng ký/Đăng nhập.

### Student/User
- Quản lý Profile (đổi avatar, cập nhật thông tin).
- Mua/enroll khóa học, học bài, theo dõi tiến độ.
- Tham gia thảo luận, đánh giá, nhắn tin, nhóm học.

### Instructor
- Tạo/cập nhật khóa học, quản lý lesson/section.
- Upload video bài học và tài nguyên.
- Xem analytics/revenue (nếu có UI).

### Admin
- Quản trị user, khóa học, duyệt/từ chối.
- Quản lý coupon, review moderation, payment management.
- Quản lý **default thumbnail** cho khóa học.

---

## 4) Chuẩn hoá upload (Cloudinary) — bắt buộc check

### 4.1 Endpoint upload chuẩn
- `POST /api/upload/image?type=...`
- `POST /api/upload/video?type=...`
- `POST /api/upload/audio?type=...`
- `POST /api/upload/document?type=...`

### 4.2 Mapping type → folder
Tất cả nằm dưới `elearning/...`:
- `avatar` → `elearning/avatars`
- `course_thumbnail` → `elearning/course-thumbnails`
- `default_course_thumbnail` → `elearning/defaults/course-thumbnails`
- `lesson_video` → `elearning/lesson-videos`
- `lesson_resource_image` → `elearning/lesson-resources/images`
- `lesson_resource_document` → `elearning/lesson-resources/documents`
- `message_attachment_image` → `elearning/message-attachments/images`
- `message_attachment_document` → `elearning/message-attachments/documents`

> Nếu Cloudinary config sai, tất cả upload sẽ fail: test “FAIL CASE” để xem hệ thống báo lỗi có rõ ràng không.

---

## 5) Kịch bản kiểm thử theo FLOW (khuyến nghị chạy theo thứ tự)

### FLOW 0 — Smoke test (5–10 phút)
**Mục tiêu:** xác nhận hệ thống chạy ổn trước khi test sâu.
1. Mở Home → reload 3 lần → không blank page.
2. Vào Courses → list load ok.
3. Thử mở 1 CourseDetail → load ok.
4. Mở Swagger → `/api/health` trả về OK.

**Expected:** không lỗi 500, không kẹt loading.

---

### FLOW 1 — Auth end‑to‑end
#### 1.1 Register
1. Guest → Register → nhập email + password + name.
2. Submit.

**Expected:**
- Thấy thông báo thành công.
- Tùy cấu hình email: có màn verify hoặc được login ngay.

#### 1.2 Login/Logout
1. Login bằng user vừa tạo.
2. Logout.
3. Login lại.

**Expected:**
- Session/Token hoạt động ổn.
- Refresh trang không bị văng login “bất chợt”.

#### 1.3 Forgot/Reset password
1. Vào “Quên mật khẩu” → nhập email.
2. Nhận link/token (tuỳ cấu hình email).
3. Reset password → login lại với password mới.

**Expected:** reset thành công, login bằng pass cũ fail.

---

### FLOW 2 — Profile + Avatar upload (Cloudinary)
1. User → Profile.
2. Cập nhật tên/sđt/bio → Save.
3. Upload avatar (jpg/png) → chờ upload xong.
4. Refresh trang.
5. Logout → login lại.

**Expected:**
- Avatar hiển thị ngay sau upload.
- Refresh/logout/login vẫn còn avatar.

**Cloudinary check:** file nằm trong `elearning/avatars`.

---

### FLOW 3 — Default thumbnail (Admin) + fallback toàn hệ thống
#### 3.1 Admin set default thumbnail
1. Admin login.
2. Mở `/admin/settings/thumbnails`.
3. Upload 1 ảnh thumbnail.
4. Set active ảnh vừa upload.

**Expected:**
- List thumbnails cập nhật.
- Active thumbnail hiển thị đúng.

#### 3.2 Kiểm tra fallback ở các trang
1. Đảm bảo có ít nhất 1 khóa học **chưa có thumbnail riêng**.
2. Mở các trang: Home, Courses, Dashboard, MyCourses.

**Expected:**
- Khóa học không thumbnail riêng → dùng default thumbnail.
- Khóa học có thumbnail riêng → ưu tiên thumbnail riêng.

**Cloudinary check:** file nằm `elearning/defaults/course-thumbnails`.

---

### FLOW 4 — Course lifecycle (Instructor/Admin)
> Nếu hệ thống có duyệt khóa học: test cả nhánh “pending → approve/reject”.

#### 4.1 Instructor tạo khóa học
1. Instructor login.
2. Vào trang tạo/Quản lý khóa học.
3. Nhập title/description/category/price/level.
4. Upload `course_thumbnail`.
5. Save.

**Expected:**
- Khóa học xuất hiện trong list.
- Thumbnail hiển thị đúng.

**Cloudinary check:** `elearning/course-thumbnails`.

#### 4.2 Admin duyệt khóa học (nếu có)
1. Admin → danh sách courses.
2. Mở chi tiết → Approve.

**Expected:** status chuyển đúng và user nhìn thấy khóa học ở trang public.

---

### FLOW 5 — Lesson/Section management + upload video/resources
#### 5.1 Tạo section + lesson
1. Instructor → LessonManagement.
2. Tạo section.
3. Tạo lesson.

**Expected:** section/lesson xuất hiện ngay và reload vẫn còn.

#### 5.2 Upload lesson video
1. Upload video với `type=lesson_video`.
2. Save lesson.
3. Mở LessonViewer (trang học).

**Expected:** video play được.

**Cloudinary check:** `elearning/lesson-videos`.

#### 5.3 Upload lesson resources
1. Upload ảnh tài nguyên `lesson_resource_image`.
2. Upload document `lesson_resource_document`.
3. Mở LessonViewer.

**Expected:**
- Ảnh hiển thị.
- Document tải/xem link được.

**Cloudinary check:** `elearning/lesson-resources/images` và `.../documents`.

---

### FLOW 6 — Enrollment/Progress/Analytics (Student)
1. Student vào khóa học đã mua/enroll.
2. Học 1–2 bài.
3. Cập nhật progress (auto hoặc bấm hoàn thành).
4. Vào Dashboard/LearningAnalytics.

**Expected:**
- Progress tăng và persist sau refresh.
- Biểu đồ/tiến độ hiển thị hợp lý.

---

### FLOW 7 — Discussions (forum)
1. Vào DiscussionList.
2. Tạo thảo luận mới.
3. Vào DiscussionDetail.
4. Reply, like.
5. Refresh.

**Expected:** dữ liệu đúng, không mất state, phân quyền edit/delete hợp lý.

---

### FLOW 8 — Reviews + Admin moderation
1. Student viết review cho khóa học.
2. Admin vào trang quản lý review.
3. Approve/Reject (kèm lý do nếu có).

**Expected:**
- Review hiển thị đúng theo status.
- Admin action phản ánh ra UI user.

---

### FLOW 9 — Coupons
1. Admin tạo coupon.
2. Student áp coupon khi checkout (nếu UI có).
3. Verify discount/validation.

**Expected:**
- Coupon invalid/expired → báo lỗi rõ.
- Coupon valid → giảm đúng.

---

### FLOW 10 — Payments end‑to‑end (UI + trạng thái)
1. Student mở PaymentCheckout của 1 course.
2. Tạo payment.
3. Nếu có simulate/return: chạy nhánh giả lập và nhánh fail.
4. Vào PaymentHistory, thử filter.

**Expected:**
- Không vỡ UI.
- Thumbnail hiển thị (có fallback nếu thiếu).
- Status/amount logic hợp lý.

---

### FLOW 11 — Messages + attachments
1. Mở Messages.
2. Gửi text.
3. Gửi ảnh `message_attachment_image`.
4. Gửi document `message_attachment_document`.
5. Refresh/reopen.

**Expected:** attachment hiện đúng, link mở được.

**Cloudinary check:** `elearning/message-attachments/images|documents`.

---

### FLOW 12 — Study Groups
1. Tạo nhóm học.
2. Tìm nhóm.
3. Join/request.
4. Approve (nếu có workflow).
5. Tạo lịch học / add resource.

**Expected:** workflow ổn, hiển thị đúng cho thành viên.

---

### FLOW 13 — Certificates
1. Hoàn thành điều kiện cấp chứng chỉ (tuỳ logic hệ thống).
2. Xem MyCertificates.
3. Verify certificate page.

**Expected:** chứng chỉ hiển thị, verify trả kết quả đúng.

---

## 6) Kịch bản kiểm thử theo “FAIL CASE” (bắt buộc chạy ít nhất 1 lần)

### 6.1 Upload sai định dạng / quá dung lượng
- Upload file không đúng (vd `.exe`) hoặc file rất lớn.

**Expected:**
- UI báo lỗi rõ ràng (toast/message).
- Backend không crash.

### 6.2 Sai cấu hình Cloudinary
- Tạm thời set sai `CLOUDINARY_*` trong backend `.env` rồi thử upload.

**Expected:**
- Báo lỗi có ý nghĩa (không im lặng).
- UI không kẹt loading.

### 6.3 Token/permission
- User thường truy cập URL admin trực tiếp.

**Expected:** redirect/chặn.

### 6.4 API validation
- Tạo course/lesson thiếu field quan trọng.

**Expected:** nhận message validation rõ, không 500.

---

## 7) Checklist UI/UX nhanh (cross‑page)

### 7.1 Loading/Empty/Error states
- Trang list khi không có data → empty state đẹp.
- Khi API fail → toast hoặc error message có nội dung.

### 7.2 Responsive
- Test 3 breakpoint: ~390px, ~768px, ~1280px.
- Không tràn ngang, không nút bị khuất.

### 7.3 Hình ảnh
- Không còn phụ thuộc external placeholder (via.placeholder) cho các khu vực chính.
- Ảnh course thumbnail/avatars luôn `object-cover` và không méo.

---

## 8) Kết quả test cần ghi lại (khuyến nghị)

- Build info: commit (nếu có), ngày test.
- Mỗi flow: PASS/FAIL + ghi chú.
- Với lỗi: kèm URL, bước tái hiện, screenshot, log console.

---

## 9) Gợi ý “bộ dữ liệu test” tối thiểu

Để test đủ các nhánh, bạn nên có:
- 01 Admin
- 01 Instructor
- 01 Student
- Ít nhất 02 khóa học:
  - Course A: có thumbnail riêng
  - Course B: không thumbnail riêng (để test fallback default)
- Mỗi course có ít nhất 01 section + 02 lessons:
  - Lesson 1 có video
  - Lesson 2 có resource (image + document)

---

Nếu bạn muốn, mình có thể bổ sung **bảng tick checklist (dạng table)** để bạn in ra/test nhanh, hoặc thêm mục “API quick checks” cho từng module (dùng Postman/cURL).
