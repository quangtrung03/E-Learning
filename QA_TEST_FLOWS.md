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

## 10) ✅ Bảng Checklist Kiểm Thử Toàn Diện

### 10.1 Smoke Test & Environment Setup

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 0.1 | Backend chạy được (`npm run dev`) | ⬜ |  |  |  |
| 0.2 | Frontend chạy được (`npm run dev`) | ⬜ |  |  |  |
| 0.3 | Health check `/api/health` trả về OK | ⬜ |  |  |  |
| 0.4 | Swagger UI accessible (`/api-docs`) | ⬜ |  |  |  |
| 0.5 | Home page load không lỗi (reload 3 lần) | ⬜ |  |  |  |
| 0.6 | Cloudinary config hoạt động | ⬜ |  |  |  |
| 0.7 | Database seed chạy thành công | ⬜ |  |  |  |

### 10.2 Authentication Flow (FLOW 1)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 1.1 | Register account mới thành công | ⬜ |  |  |  |
| 1.2 | Email verification (nếu có) | ⬜ |  |  |  |
| 1.3 | Login với user vừa tạo | ⬜ |  |  |  |
| 1.4 | Logout thành công | ⬜ |  |  |  |
| 1.5 | Login lại sau logout | ⬜ |  |  |  |
| 1.6 | Session persist sau refresh | ⬜ |  |  |  |
| 1.7 | Forgot password flow | ⬜ |  |  |  |
| 1.8 | Reset password thành công | ⬜ |  |  |  |
| 1.9 | Login với password mới | ⬜ |  |  |  |
| 1.10 | Login với password cũ bị reject | ⬜ |  |  |  |

### 10.3 Profile & Avatar Upload (FLOW 2)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 2.1 | Cập nhật profile info (name/phone/bio) | ⬜ |  |  |  |
| 2.2 | Upload avatar (jpg/png) | ⬜ |  |  |  |
| 2.3 | Avatar hiển thị ngay sau upload | ⬜ |  |  |  |
| 2.4 | Avatar persist sau refresh | ⬜ |  |  |  |
| 2.5 | Avatar persist sau logout/login | ⬜ |  |  |  |
| 2.6 | Cloudinary folder đúng (`avatars`) | ⬜ |  |  |  |

### 10.4 Default Thumbnail Management (FLOW 3)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 3.1 | Admin access settings/thumbnails | ⬜ |  |  |  |
| 3.2 | Upload default thumbnail | ⬜ |  |  |  |
| 3.3 | Set thumbnail active | ⬜ |  |  |  |
| 3.4 | Default thumbnail hiển thị trên Home | ⬜ |  |  |  |
| 3.5 | Default thumbnail hiển thị trên Courses | ⬜ |  |  |  |
| 3.6 | Default thumbnail hiển thị trên Dashboard | ⬜ |  |  |  |
| 3.7 | Course có thumbnail riêng ưu tiên đúng | ⬜ |  |  |  |
| 3.8 | Cloudinary folder đúng (`defaults/course-thumbnails`) | ⬜ |  |  |  |

### 10.5 Course Management (FLOW 4)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 4.1 | Instructor tạo course mới | ⬜ |  |  |  |
| 4.2 | Upload course thumbnail | ⬜ |  |  |  |
| 4.3 | Course thumbnail hiển thị đúng | ⬜ |  |  |  |
| 4.4 | Cloudinary folder đúng (`course-thumbnails`) | ⬜ |  |  |  |
| 4.5 | Course xuất hiện trong list instructor | ⬜ |  |  |  |
| 4.6 | Admin xem pending courses | ⬜ |  |  |  |
| 4.7 | Admin approve course | ⬜ |  |  |  |
| 4.8 | Admin reject course (với lý do) | ⬜ |  |  |  |
| 4.9 | Approved course hiển thị public | ⬜ |  |  |  |
| 4.10 | Instructor update course info | ⬜ |  |  |  |
| 4.11 | Instructor soft delete course | ⬜ |  |  |  |

### 10.6 Lesson & Section Management (FLOW 5)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 5.1 | Tạo section mới | ⬜ |  |  |  |
| 5.2 | Tạo lesson trong section | ⬜ |  |  |  |
| 5.3 | Upload lesson video | ⬜ |  |  |  |
| 5.4 | Cloudinary folder đúng (`lesson-videos`) | ⬜ |  |  |  |
| 5.5 | Lesson video play được trong LessonViewer | ⬜ |  |  |  |
| 5.6 | Upload lesson resource image | ⬜ |  |  |  |
| 5.7 | Cloudinary folder đúng (`lesson-resources/images`) | ⬜ |  |  |  |
| 5.8 | Upload lesson resource document | ⬜ |  |  |  |
| 5.9 | Cloudinary folder đúng (`lesson-resources/documents`) | ⬜ |  |  |  |
| 5.10 | Resources hiển thị trong LessonViewer | ⬜ |  |  |  |
| 5.11 | Document download/view được | ⬜ |  |  |  |
| 5.12 | Reorder sections/lessons | ⬜ |  |  |  |
| 5.13 | Delete section/lesson | ⬜ |  |  |  |

### 10.7 Enrollment & Progress (FLOW 6)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 6.1 | Student enroll khóa học free | ⬜ |  |  |  |
| 6.2 | Student mua khóa học có phí | ⬜ |  |  |  |
| 6.3 | Enrolled course xuất hiện trong MyCourses | ⬜ |  |  |  |
| 6.4 | Học bài lesson đầu tiên | ⬜ |  |  |  |
| 6.5 | Progress tự động cập nhật | ⬜ |  |  |  |
| 6.6 | Mark lesson completed | ⬜ |  |  |  |
| 6.7 | Progress persist sau refresh | ⬜ |  |  |  |
| 6.8 | Dashboard hiển thị progress đúng | ⬜ |  |  |  |
| 6.9 | Learning analytics hiển thị | ⬜ |  |  |  |
| 6.10 | Resume lesson cuối cùng | ⬜ |  |  |  |

### 10.8 Discussions (FLOW 7)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 7.1 | Xem discussion list | ⬜ |  |  |  |
| 7.2 | Tạo discussion mới | ⬜ |  |  |  |
| 7.3 | Xem discussion detail | ⬜ |  |  |  |
| 7.4 | Reply discussion | ⬜ |  |  |  |
| 7.5 | Like/unlike discussion | ⬜ |  |  |  |
| 7.6 | Edit own discussion | ⬜ |  |  |  |
| 7.7 | Delete own discussion | ⬜ |  |  |  |
| 7.8 | Discussion persist sau refresh | ⬜ |  |  |  |
| 7.9 | Permission check (không edit được của người khác) | ⬜ |  |  |  |

### 10.9 Reviews & Moderation (FLOW 8)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 8.1 | Student viết review cho khóa học | ⬜ |  |  |  |
| 8.2 | Review hiển thị trong course detail | ⬜ |  |  |  |
| 8.3 | Admin xem pending reviews | ⬜ |  |  |  |
| 8.4 | Admin approve review | ⬜ |  |  |  |
| 8.5 | Admin reject review (với lý do) | ⬜ |  |  |  |
| 8.6 | Approved review hiển thị public | ⬜ |  |  |  |
| 8.7 | Rejected review không hiển thị | ⬜ |  |  |  |
| 8.8 | Course rating tự động cập nhật | ⬜ |  |  |  |

### 10.10 Coupons (FLOW 9)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 9.1 | Admin tạo coupon mới | ⬜ |  |  |  |
| 9.2 | Apply coupon trong checkout | ⬜ |  |  |  |
| 9.3 | Invalid coupon bị reject | ⬜ |  |  |  |
| 9.4 | Expired coupon bị reject | ⬜ |  |  |  |
| 9.5 | Exhausted coupon bị reject | ⬜ |  |  |  |
| 9.6 | Valid coupon giảm giá đúng | ⬜ |  |  |  |
| 9.7 | Usage count tăng sau apply | ⬜ |  |  |  |

### 10.11 Payment Flow (FLOW 10)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 10.1 | Mở payment checkout page | ⬜ |  |  |  |
| 10.2 | Thumbnail hiển thị đúng (hoặc fallback) | ⬜ |  |  |  |
| 10.3 | Tạo payment order | ⬜ |  |  |  |
| 10.4 | Simulate payment success | ⬜ |  |  |  |
| 10.5 | Simulate payment failed | ⬜ |  |  |  |
| 10.6 | Payment history hiển thị đúng | ⬜ |  |  |  |
| 10.7 | Filter payment by status | ⬜ |  |  |  |
| 10.8 | Admin xem payment management | ⬜ |  |  |  |
| 10.9 | Admin refund payment | ⬜ |  |  |  |
| 10.10 | Invoice generation | ⬜ |  |  |  |

### 10.12 Messages & Attachments (FLOW 11)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 11.1 | Mở messages page | ⬜ |  |  |  |
| 11.2 | Gửi text message | ⬜ |  |  |  |
| 11.3 | Gửi image attachment | ⬜ |  |  |  |
| 11.4 | Cloudinary folder đúng (`message-attachments/images`) | ⬜ |  |  |  |
| 11.5 | Gửi document attachment | ⬜ |  |  |  |
| 11.6 | Cloudinary folder đúng (`message-attachments/documents`) | ⬜ |  |  |  |
| 11.7 | Attachments hiển thị trong conversation | ⬜ |  |  |  |
| 11.8 | Download/view attachment | ⬜ |  |  |  |
| 11.9 | Real-time message (Socket.IO) | ⬜ |  |  |  |
| 11.10 | Messages persist sau refresh | ⬜ |  |  |  |

### 10.13 Study Groups (FLOW 12)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 12.1 | Tạo study group mới | ⬜ |  |  |  |
| 12.2 | Tìm kiếm study groups | ⬜ |  |  |  |
| 12.3 | Join public group | ⬜ |  |  |  |
| 12.4 | Request join private group | ⬜ |  |  |  |
| 12.5 | Approve join request | ⬜ |  |  |  |
| 12.6 | Reject join request | ⬜ |  |  |  |
| 12.7 | Tạo study session | ⬜ |  |  |  |
| 12.8 | Add resource vào group | ⬜ |  |  |  |
| 12.9 | Group chat/discussion | ⬜ |  |  |  |
| 12.10 | Leave group | ⬜ |  |  |  |

### 10.14 Certificates (FLOW 13)

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| 13.1 | Hoàn thành course đủ điều kiện | ⬜ |  |  |  |
| 13.2 | Certificate tự động generate | ⬜ |  |  |  |
| 13.3 | Xem MyCertificates page | ⬜ |  |  |  |
| 13.4 | Download certificate PDF | ⬜ |  |  |  |
| 13.5 | Verify certificate page | ⬜ |  |  |  |
| 13.6 | Verify với certificate ID đúng | ⬜ |  |  |  |
| 13.7 | Verify với certificate ID sai bị reject | ⬜ |  |  |  |

### 10.15 Fail Cases & Edge Cases

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| F.1 | Upload file sai định dạng (.exe) | ⬜ |  |  |  |
| F.2 | Upload file quá dung lượng | ⬜ |  |  |  |
| F.3 | Upload khi Cloudinary config sai | ⬜ |  |  |  |
| F.4 | User access admin URL bị chặn | ⬜ |  |  |  |
| F.5 | Guest access protected route bị redirect | ⬜ |  |  |  |
| F.6 | Tạo course thiếu required fields | ⬜ |  |  |  |
| F.7 | API validation message rõ ràng | ⬜ |  |  |  |
| F.8 | Network error handling | ⬜ |  |  |  |
| F.9 | Empty state hiển thị đúng | ⬜ |  |  |  |
| F.10 | Loading state không kẹt vô hạn | ⬜ |  |  |  |

### 10.16 UI/UX Cross-Page Checks

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| U.1 | Responsive mobile (~390px) | ⬜ |  |  |  |
| U.2 | Responsive tablet (~768px) | ⬜ |  |  |  |
| U.3 | Responsive desktop (~1280px+) | ⬜ |  |  |  |
| U.4 | Images không méo (object-cover) | ⬜ |  |  |  |
| U.5 | Không còn external placeholder URLs | ⬜ |  |  |  |
| U.6 | Loading spinners display properly | ⬜ |  |  |  |
| U.7 | Toast notifications show/hide correctly | ⬜ |  |  |  |
| U.8 | Modals close properly | ⬜ |  |  |  |
| U.9 | Forms validation feedback clear | ⬜ |  |  |  |
| U.10 | Navigation menu works all pages | ⬜ |  |  |  |

### 10.17 Dashboard & Analytics

| # | Test Case | Status | Notes / Issues | Tester | Date |
|---|-----------|--------|---------------|---------|------|
| D.1 | Student dashboard load stats đúng | ⬜ |  |  |  |
| D.2 | Instructor dashboard load stats đúng | ⬜ |  |  |  |
| D.3 | Admin dashboard load stats đúng | ⬜ |  |  |  |
| D.4 | Revenue charts hiển thị | ⬜ |  |  |  |
| D.5 | Students list modal | ⬜ |  |  |  |
| D.6 | Revenue detail modal | ⬜ |  |  |  |
| D.7 | Analytics filters hoạt động | ⬜ |  |  |  |
| D.8 | Export/download data (nếu có) | ⬜ |  |  |  |

---

## 11) Hướng Dẫn Sử Dụng Checklist

### Cách đánh dấu:
- ⬜ : Chưa test
- ✅ : PASS
- ❌ : FAIL
- ⚠️ : PASS có lưu ý

### Workflow khuyến nghị:
1. **In bảng checklist** hoặc mở file này trên màn hình phụ
2. **Test theo thứ tự** từ trên xuống (Smoke → Auth → Profile → ...)
3. **Tick ngay** sau khi test xong mỗi case
4. **Ghi chú** vào cột "Notes / Issues":
   - Lỗi phát hiện (kèm screenshot nếu có)
   - Số dòng code liên quan
   - Mức độ nghiêm trọng: Critical / Major / Minor
5. **Ghi tên tester & ngày** để tracking
6. **Tổng hợp** sau mỗi session test

### Mẫu ghi chú lỗi:
```
❌ Avatar không hiển thị sau refresh
- Reproduce: Upload avatar → Refresh page → Avatar mất
- Console error: "Failed to fetch image"
- Severity: Major
- Screenshot: [link]
```

---

**Tip:** Copy toàn bộ bảng sang Google Sheets hoặc Notion để team cùng cập nhật real-time!
