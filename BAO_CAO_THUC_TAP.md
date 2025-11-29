# BÁO CÁO THỰC TÂP - HỆ THỐNG E-LEARNING

**Sinh viên thực hiện:** [Họ tên sinh viên]  
**Ngày hoàn thành:** 28/11/2025  
**Công nghệ:** Node.js, Express, MongoDB, React, Vite, Render, Vercel

---

## 1. DANH SÁCH CHỨC NĂNG CHI TIẾT

### 1.1. Chức năng User (Học viên)

#### Xác thực và Quản lý Tài khoản
- Đăng ký tài khoản mới
- Đăng nhập/Đăng xuất
- Xác thực email qua token
- Quên mật khẩu và đặt lại mật khẩu
- Cập nhật thông tin cá nhân (tên, ảnh đại diện, số điện thoại, tiểu sử)
- Yêu cầu quyền Admin (gửi form với CCCD, ngày sinh, địa chỉ)

#### Quản lý Khóa học
- Xem danh sách khóa học (có phân trang, tìm kiếm, lọc theo danh mục/cấp độ)
- Xem chi tiết khóa học
- Đăng ký học khóa học
- Xem khóa học đã đăng ký
- Theo dõi tiến độ học tập

#### Tạo và Quản lý Khóa học (Instructor)
- Tạo khóa học mới
- Cập nhật/Xóa khóa học của mình
- Upload thumbnail khóa học
- Gửi khóa học để Admin duyệt
- Xem danh sách học viên đã đăng ký
- Xem doanh thu từ các khóa học

#### Quản lý Bài học
- Tạo/Sửa/Xóa bài học
- Upload video bài học (lưu trữ trong GridFS)
- Đánh dấu bài học đã hoàn thành
- Tải tài liệu học tập

#### Bài tập và Kiểm tra
- Xem danh sách bài tập
- Làm bài tập (Quiz, Essay, Project, Coding)
- Nộp bài tập
- Xem kết quả và điểm số
- Làm lại bài tập (nếu được phép)

#### Chứng chỉ
- Nhận chứng chỉ sau khi hoàn thành khóa học
- Xem danh sách chứng chỉ đã đạt được
- Xác thực chứng chỉ bằng Certificate ID

#### Đánh giá và Review
- Đánh giá khóa học (1-5 sao)
- Viết review chi tiết (ưu/nhược điểm)
- Đánh giá theo nhiều tiêu chí (nội dung, giảng viên, giá trị)
- Like/Report review của người khác

#### Thảo luận
- Tạo topic thảo luận trong khóa học
- Trả lời topic thảo luận
- Like/Unlike bài viết
- Đánh dấu câu trả lời hay nhất

#### Nhóm học tập
- Tạo nhóm học tập
- Tham gia nhóm học tập
- Thảo luận trong nhóm
- Mời thành viên mới

#### Tin nhắn
- Gửi/Nhận tin nhắn real-time (Socket.IO)
- Xem lịch sử tin nhắn
- Nhận thông báo tin nhắn mới

#### Thanh toán
- Thanh toán khóa học (Stripe, VNPay, MoMo)
- Áp dụng mã giảm giá (Coupon)
- Xem lịch sử thanh toán
- Xem hóa đơn

#### Phân tích học tập
- Xem thống kê thời gian học
- Xem biểu đồ tiến độ
- Xem điểm số các bài tập

### 1.2. Chức năng Admin (Quản trị viên)

#### Quản lý Khóa học
- Xem tất cả khóa học
- Duyệt/Từ chối khóa học
- Xóa khóa học vi phạm
- Xem chi tiết khóa học

#### Quản lý Người dùng
- Xem danh sách tất cả người dùng
- Khóa/Mở khóa tài khoản người dùng
- Cấp quyền Admin cho người dùng
- Xem chi tiết người dùng

#### Quản lý Yêu cầu Admin
- Xem danh sách yêu cầu trở thành Admin
- Duyệt/Từ chối yêu cầu Admin
- Xem thông tin chi tiết yêu cầu (CCCD, địa chỉ, lý do)

#### Quản lý Danh mục
- Tạo/Sửa/Xóa danh mục khóa học
- Upload ảnh banner danh mục

#### Quản lý Giảng viên
- Tạo/Sửa/Xóa hồ sơ giảng viên
- Upload ảnh giảng viên

#### Quản lý Mã giảm giá
- Tạo/Sửa/Xóa mã giảm giá
- Giới hạn số lần sử dụng
- Đặt thời hạn hiệu lực

#### Thống kê
- Tổng số người dùng, khóa học, doanh thu
- Biểu đồ thống kê theo thời gian
- Danh sách khóa học phổ biến nhất

---

## 2. CẤU TRÚC CƠ SỞ DỮ LIỆU MONGODB

### 2.1. Collection: Users
**Mô tả:** Lưu trữ thông tin người dùng

**Các trường chính:**
- `_id`: ObjectId
- `name`: String (Họ tên)
- `email`: String (Unique, email đăng nhập)
- `password`: String (Mã hóa bằng bcrypt)
- `isAdmin`: Boolean (Quyền admin)
- `adminRequestPending`: Boolean
- `avatar`: String (URL Cloudinary)
- `phone`, `bio`: String
- `emailVerified`: Boolean
- `enrolledCourses`: Array (danh sách khóa học đã đăng ký)
- `createdCourses`: Array (khóa học đã tạo)
- `timestamps`: createdAt, updatedAt

**Quan hệ:**
- 1-N với Courses (instructor)
- N-N với Courses (enrolledCourses)
- 1-N với Reviews, Discussions, Messages

### 2.2. Collection: Courses
**Mô tả:** Lưu trữ thông tin khóa học

**Các trường chính:**
- `_id`: ObjectId
- `title`: String (Tiêu đề khóa học)
- `description`: String (Mô tả chi tiết)
- `instructor`: ObjectId ref User
- `category`: String (programming, design, business, ...)
- `level`: String (beginner, intermediate, advanced)
- `price`: Number
- `discount`: Number (%)
- `thumbnail`: String (URL)
- `duration`: Number (phút)
- `lessons`: Array[ObjectId] ref Lesson
- `students`: Array (thông tin học viên và tiến độ)
- `rating`: Object (average, count)
- `status`: String (draft, pending, approved, rejected)
- `approvedBy`: ObjectId ref User
- `requirements`, `whatYouWillLearn`, `tags`: Array[String]

**Quan hệ:**
- N-1 với Users (instructor)
- 1-N với Lessons
- N-N với Users (students)
- 1-N với Reviews, Assignments, Discussions

### 2.3. Collection: Lessons
**Mô tả:** Lưu trữ bài học trong khóa học

**Các trường chính:**
- `_id`: ObjectId
- `title`: String
- `description`: String
- `course`: ObjectId ref Course
- `order`: Number (thứ tự bài học)
- `content`: String (Nội dung bài học)
- `contentType`: String (text, video, pdf, quiz)
- `video`: Object (filename, fileId GridFS, size)
- `videoUrl`: String (legacy, URL ngoài)
- `duration`: Number (phút)
- `resources`: Array (tài liệu đính kèm)
- `isPreview`: Boolean (xem trước miễn phí)
- `completedBy`: Array (học viên đã hoàn thành)

**Quan hệ:**
- N-1 với Courses
- 1-N với Assignments

### 2.4. Collection: Payments
**Mô tả:** Lưu trữ giao dịch thanh toán

**Các trường chính:**
- `_id`: ObjectId
- `user`: ObjectId ref User
- `course`: ObjectId ref Course
- `orderId`: String (unique)
- `amount`: Object (original, discount, final, currency)
- `paymentMethod`: Object (type, provider, last4, brand)
- `status`: String (pending, processing, completed, failed, cancelled, refunded)
- `transactionId`: String (unique)
- `couponCode`: String
- `billingAddress`: Object
- `invoice`: Object (number, url, issuedAt)
- `refund`: Object (amount, reason, status)
- `timeline`: Array (lịch sử trạng thái)

**Quan hệ:**
- N-1 với Users
- N-1 với Courses
- N-1 với Coupons (qua couponCode)

### 2.5. Collection: Assignments
**Mô tả:** Lưu trữ bài tập và quiz

**Các trường chính:**
- `_id`: ObjectId
- `title`, `description`: String
- `course`: ObjectId ref Course
- `lesson`: ObjectId ref Lesson
- `instructor`: ObjectId ref User
- `type`: String (quiz, essay, project, coding)
- `questions`: Array[Object] (câu hỏi, đáp án, điểm)
- `timeLimit`: Number (phút)
- `maxAttempts`: Number
- `passingScore`: Number
- `totalPoints`: Number
- `startDate`, `dueDate`: Date
- `isPublished`: Boolean

**Quan hệ:**
- N-1 với Courses
- N-1 với Lessons
- 1-N với Submissions

### 2.6. Collection: Submissions
**Mô tả:** Lưu trữ bài làm của học viên

**Các trường chính:**
- `_id`: ObjectId
- `assignment`: ObjectId ref Assignment
- `student`: ObjectId ref User
- `answers`: Array (câu trả lời)
- `score`: Number
- `totalScore`: Number
- `percentage`: Number
- `attemptNumber`: Number
- `timeSpent`: Number (giây)
- `status`: String (submitted, graded, late)
- `feedback`: String

**Quan hệ:**
- N-1 với Assignments
- N-1 với Users

### 2.7. Collection: Certificates
**Mô tả:** Lưu trữ chứng chỉ

**Các trường chính:**
- `_id`: ObjectId
- `user`: ObjectId ref User
- `course`: ObjectId ref Course
- `certificateId`: String (unique, CERT-XXX)
- `certificateName`: String
- `completionDate`, `issueDate`: Date
- `score`: Number
- `grade`: String (A+, A, B+, ...)
- `certificateUrl`: String
- `certificateHash`: String (unique)
- `issuedBy`: Object (name, title, signature)
- `metadata`: Object (lessons, assignments, time spent)
- `status`: String (active, revoked, expired)

**Quan hệ:**
- N-1 với Users
- N-1 với Courses

### 2.8. Collection: Reviews
**Mô tả:** Đánh giá khóa học

**Các trường chính:**
- `_id`: ObjectId
- `course`: ObjectId ref Course
- `user`: ObjectId ref User (unique per course)
- `rating`: Number (1-5)
- `title`, `comment`: String
- `pros`, `cons`: Array[String]
- `aspects`: Object (contentQuality, instructorQuality, ...)
- `helpful`: Array (người thấy hữu ích)
- `reported`: Array (báo cáo vi phạm)
- `verified`: Boolean (đã hoàn thành khóa học)
- `wouldRecommend`: Boolean
- `instructorResponse`: Object
- `status`: String (active, hidden, flagged, removed)

**Quan hệ:**
- N-1 với Courses
- N-1 với Users

### 2.9. Collection: Discussions
**Mô tả:** Diễn đàn thảo luận

**Các trường chính:**
- `_id`: ObjectId
- `course`: ObjectId ref Course
- `lesson`: ObjectId ref Lesson
- `title`, `content`: String
- `author`: ObjectId ref User
- `category`: String (general, question, announcement, ...)
- `tags`: Array[String]
- `replies`: Array[Object] (nested replies)
- `views`, `likes`: Number/Array
- `pinned`, `locked`, `solved`: Boolean
- `bestAnswer`: ObjectId (reply ID)
- `lastActivity`: Date

**Quan hệ:**
- N-1 với Courses
- N-1 với Lessons
- N-1 với Users (author)

### 2.10. Collection: StudyGroups
**Mô tả:** Nhóm học tập

**Các trường chính:**
- `_id`: ObjectId
- `name`, `description`: String
- `course`: ObjectId ref Course
- `creator`: ObjectId ref User
- `members`: Array[ObjectId] ref User
- `maxMembers`: Number
- `isPublic`: Boolean
- `joinCode`: String
- `tags`: Array[String]
- `status`: String (active, archived)

**Quan hệ:**
- N-1 với Courses
- N-N với Users (members)

### 2.11. Collection: Messages / Conversations
**Mô tả:** Tin nhắn trực tiếp

**Conversations:**
- `_id`: ObjectId
- `participants`: Array[ObjectId] ref User
- `type`: String (direct, group)
- `lastMessage`: ObjectId ref Message
- `unreadCount`: Object (per user)

**Messages:**
- `_id`: ObjectId
- `conversation`: ObjectId ref Conversation
- `sender`: ObjectId ref User
- `content`: String
- `attachments`: Array
- `readBy`: Array[Object]
- `isDeleted`: Boolean

**Quan hệ:**
- Conversations N-N với Users
- Messages N-1 với Conversations

### 2.12. Collection: Coupons
**Mô tả:** Mã giảm giá

**Các trường chính:**
- `_id`: ObjectId
- `code`: String (unique)
- `discountType`: String (percentage, fixed)
- `discountValue`: Number
- `minimumAmount`: Number
- `maxUsage`: Number
- `usedCount`: Number
- `validFrom`, `validUntil`: Date
- `applicableCourses`: Array[ObjectId]
- `isActive`: Boolean

### 2.13. Các Collection khác
- **AdminRequests:** Yêu cầu trở thành admin (fullName, citizenId, dateOfBirth, phone, address, reason, status)
- **EmailVerification:** Token xác thực email
- **PasswordReset:** Token đặt lại mật khẩu
- **LearningAnalytics:** Thống kê học tập của user
- **Categories:** Danh mục khóa học (name, description, icon, banner)
- **Instructors:** Hồ sơ giảng viên (name, bio, avatar, expertise, rating)

---

## 3. CÁC API ENDPOINTS CHÍNH

### 3.1. Authentication (/api/auth)
```
POST   /api/auth/register              - Đăng ký tài khoản
POST   /api/auth/login                 - Đăng nhập
GET    /api/auth/me                    - Lấy thông tin user hiện tại
PUT    /api/auth/update-profile        - Cập nhật profile
POST   /api/auth/verify-email          - Xác thực email
POST   /api/auth/resend-verification   - Gửi lại email xác thực
POST   /api/auth/forgot-password       - Quên mật khẩu
GET    /api/auth/verify-reset-token/:token - Xác thực token reset
POST   /api/auth/reset-password        - Đặt lại mật khẩu
POST   /api/auth/admin/request         - Yêu cầu quyền admin
GET    /api/auth/admin/validate/:token - Validate token admin request
POST   /api/auth/admin/submit-request  - Gửi form admin chi tiết
```

### 3.2. Courses (/api/courses)
```
GET    /api/courses                    - Lấy danh sách khóa học (filter, search, pagination)
GET    /api/courses/:id                - Lấy chi tiết khóa học
POST   /api/courses                    - Tạo khóa học mới (Auth)
PUT    /api/courses/:id                - Cập nhật khóa học (Owner/Admin)
DELETE /api/courses/:id                - Xóa khóa học (Owner/Admin)
POST   /api/courses/:id/enroll         - Đăng ký học khóa học (Auth)
PUT    /api/courses/:id/submit         - Gửi khóa học để duyệt (Auth)
GET    /api/courses/my-courses         - Khóa học tôi tạo (Auth)
GET    /api/courses/enrolled           - Khóa học đã đăng ký (Auth)
GET    /api/courses/my-students        - Học viên của tôi (Auth)
GET    /api/courses/my-revenue         - Doanh thu khóa học (Auth)
POST   /api/courses/:id/upload-thumbnail - Upload thumbnail (Auth)
```

### 3.3. Lessons (/api/lessons)
```
GET    /api/lessons                    - Lấy danh sách bài học
GET    /api/lessons/:id                - Lấy chi tiết bài học
POST   /api/lessons                    - Tạo bài học (Auth)
PUT    /api/lessons/:id                - Cập nhật bài học (Auth)
DELETE /api/lessons/:id                - Xóa bài học (Auth)
POST   /api/lessons/:id/complete       - Đánh dấu hoàn thành (Auth)
POST   /api/lessons/:id/upload-video   - Upload video (Auth)
```

### 3.4. Admin (/api/admin)
```
GET    /api/admin/stats                - Thống kê tổng quan (Admin)
GET    /api/admin/courses/pending      - Khóa học chờ duyệt (Admin)
GET    /api/admin/courses/all          - Tất cả khóa học (Admin)
GET    /api/admin/courses/:id          - Chi tiết khóa học (Admin)
PUT    /api/admin/courses/:id/approve  - Duyệt khóa học (Admin)
PUT    /api/admin/courses/:id/reject   - Từ chối khóa học (Admin)
DELETE /api/admin/courses/:id          - Xóa khóa học (Admin)
GET    /api/admin/users                - Danh sách người dùng (Admin)
GET    /api/admin/users/:id            - Chi tiết người dùng (Admin)
PUT    /api/admin/users/:id/toggle-ban - Khóa/Mở tài khoản (Admin)
PUT    /api/admin/users/:id/make-admin - Cấp quyền admin (Admin)
GET    /api/admin/requests             - Yêu cầu admin (Admin)
GET    /api/admin/requests/:id         - Chi tiết yêu cầu (Admin)
PUT    /api/admin/requests/:id/approve - Duyệt yêu cầu admin (Admin)
PUT    /api/admin/requests/:id/reject  - Từ chối yêu cầu admin (Admin)
```

### 3.5. Assignments (/api/assignments)
```
GET    /api/assignments                - Danh sách bài tập
GET    /api/assignments/:id            - Chi tiết bài tập
POST   /api/assignments                - Tạo bài tập (Auth)
PUT    /api/assignments/:id            - Cập nhật bài tập (Auth)
DELETE /api/assignments/:id            - Xóa bài tập (Auth)
POST   /api/assignments/:id/submit     - Nộp bài (Auth)
GET    /api/assignments/:id/submissions - Danh sách bài nộp (Auth)
PUT    /api/assignments/:id/grade      - Chấm điểm (Auth)
```

### 3.6. Certificates (/api/certificates)
```
GET    /api/certificates               - Danh sách chứng chỉ của tôi (Auth)
GET    /api/certificates/:id           - Chi tiết chứng chỉ (Auth)
POST   /api/certificates/generate      - Tạo chứng chỉ (Auth)
GET    /api/certificates/verify/:certificateId - Xác thực chứng chỉ
```

### 3.7. Payments (/api/payments)
```
POST   /api/payments/create            - Tạo thanh toán (Auth)
GET    /api/payments/:id               - Chi tiết thanh toán (Auth)
GET    /api/payments/history           - Lịch sử thanh toán (Auth)
POST   /api/payments/vnpay/return      - VNPay callback
POST   /api/payments/momo/return       - MoMo callback
POST   /api/payments/stripe/webhook    - Stripe webhook
POST   /api/payments/:id/refund        - Hoàn tiền (Auth)
```

### 3.8. Reviews (/api/reviews)
```
GET    /api/reviews/course/:courseId   - Review của khóa học
POST   /api/reviews                    - Tạo review (Auth)
PUT    /api/reviews/:id                - Cập nhật review (Auth)
DELETE /api/reviews/:id                - Xóa review (Auth)
POST   /api/reviews/:id/helpful        - Đánh dấu hữu ích (Auth)
POST   /api/reviews/:id/report         - Báo cáo vi phạm (Auth)
```

### 3.9. Discussions (/api/discussions)
```
GET    /api/discussions/course/:courseId - Thảo luận trong khóa học
GET    /api/discussions/:id            - Chi tiết thảo luận
POST   /api/discussions                - Tạo thảo luận (Auth)
PUT    /api/discussions/:id            - Cập nhật thảo luận (Auth)
DELETE /api/discussions/:id            - Xóa thảo luận (Auth)
POST   /api/discussions/:id/reply      - Trả lời (Auth)
POST   /api/discussions/:id/like       - Like (Auth)
PUT    /api/discussions/:id/pin        - Ghim bài (Auth)
PUT    /api/discussions/:id/lock       - Khóa bài (Auth)
```

### 3.10. Study Groups (/api/study-groups)
```
GET    /api/study-groups               - Danh sách nhóm học tập
GET    /api/study-groups/:id           - Chi tiết nhóm
POST   /api/study-groups               - Tạo nhóm (Auth)
PUT    /api/study-groups/:id           - Cập nhật nhóm (Auth)
DELETE /api/study-groups/:id           - Xóa nhóm (Auth)
POST   /api/study-groups/:id/join      - Tham gia nhóm (Auth)
POST   /api/study-groups/:id/leave     - Rời nhóm (Auth)
```

### 3.11. Messages (/api/messages)
```
GET    /api/messages/conversations     - Danh sách cuộc hội thoại (Auth)
GET    /api/messages/:conversationId   - Tin nhắn trong hội thoại (Auth)
POST   /api/messages                   - Gửi tin nhắn (Auth)
PUT    /api/messages/:id/read          - Đánh dấu đã đọc (Auth)
DELETE /api/messages/:id               - Xóa tin nhắn (Auth)
```

### 3.12. Analytics (/api/analytics)
```
GET    /api/analytics/dashboard        - Dashboard thống kê (Auth)
GET    /api/analytics/course/:courseId - Thống kê khóa học (Auth)
GET    /api/analytics/learning-time    - Thời gian học (Auth)
GET    /api/analytics/progress         - Tiến độ học tập (Auth)
```

### 3.13. Coupons (/api/coupons)
```
GET    /api/coupons                    - Danh sách coupon (Admin)
POST   /api/coupons                    - Tạo coupon (Admin)
PUT    /api/coupons/:id                - Cập nhật coupon (Admin)
DELETE /api/coupons/:id                - Xóa coupon (Admin)
POST   /api/coupons/validate           - Validate coupon (Auth)
```

### 3.14. Categories & Instructors
```
GET    /api/categories                 - Danh sách danh mục
POST   /api/categories                 - Tạo danh mục (Admin)
PUT    /api/categories/:id             - Cập nhật danh mục (Admin)
DELETE /api/categories/:id             - Xóa danh mục (Admin)

GET    /api/instructors                - Danh sách giảng viên
POST   /api/instructors                - Tạo hồ sơ giảng viên (Admin)
PUT    /api/instructors/:id            - Cập nhật (Admin)
DELETE /api/instructors/:id            - Xóa (Admin)
```

### 3.15. Upload & Files
```
POST   /api/upload/image               - Upload ảnh (Auth)
POST   /api/upload/video               - Upload video (Auth)
POST   /api/upload/file                - Upload file (Auth)
GET    /api/files/:filename            - Lấy file từ GridFS
GET    /api/files/stream/:filename     - Stream video
```

---

## 4. VẤN ĐỀ KỸ THUẬT ĐÃ GIẢI QUYẾT

### 4.1. Lỗi CORS giữa Vercel (Frontend) và Render (Backend)

**Vấn đề:**
- Frontend deploy trên Vercel không thể gọi API từ Backend trên Render
- Lỗi: "Access-Control-Allow-Origin" header missing
- Preflight request (OPTIONS) bị block

**Giải pháp:**
```javascript
// backend/src/server.js
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      'http://localhost:5173'
    ].filter(Boolean);
    
    // Allow Vercel deployments
    const isVercelDomain = /^https:\/\/.*\.vercel\.app$/.test(origin);
    
    if (allowedOrigins.includes(origin) || isVercelDomain || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

**Biến môi trường cần thiết:**
- `CORS_ORIGIN=https://your-app.vercel.app`
- `FRONTEND_URL=https://your-app.vercel.app`

### 4.2. Lỗi 404 Route sau khi Deploy Frontend trên Vercel

**Vấn đề:**
- Refresh trang trên route động (vd: /courses/123) báo lỗi 404
- Vercel không tìm thấy file tương ứng với route

**Giải pháp:**
Tạo file `vercel.json` để redirect tất cả requests về index.html:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Hoặc tạo file `public/_redirects`:
```
/*    /index.html   200
```

### 4.3. Lỗi Validation Mongoose

**Vấn đề:**
- ValidationError khi save document với enum field có giá trị null
- Lỗi: "difficulty is not a valid enum value"

**Giải pháp:**
```javascript
// Thay vì dùng null, dùng undefined cho optional enum fields
difficulty: {
  type: String,
  enum: {
    values: ['very-easy', 'easy', 'medium', 'hard', 'very-hard'],
    message: 'Difficulty must be one of: very-easy, easy, medium, hard, very-hard'
  },
  default: undefined  // Thay vì null
}
```

### 4.4. Lỗi Rate Limiting trên Render

**Vấn đề:**
- Rate limiter không hoạt động đúng do proxy của Render
- IP của client không được detect chính xác

**Giải pháp:**
```javascript
// Trust proxy setting
app.set('trust proxy', 1);

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false
});
```

### 4.5. Lỗi Upload File lớn (Video)

**Vấn đề:**
- Upload video lớn bị timeout
- Mongoose lưu video vào Collection thất bại (vượt quá 16MB limit)

**Giải pháp:**
Sử dụng GridFS để lưu file lớn:
```javascript
// backend/src/config/gridfs.js
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

let gfs;

const initGridFS = () => {
  const conn = mongoose.connection;
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
};

// Upload video vào GridFS thay vì Collection thông thường
```

### 4.6. Lỗi JWT Token Expired

**Vấn đề:**
- Token hết hạn sau 7 ngày, user phải đăng nhập lại
- Không có refresh token mechanism

**Giải pháp:**
```javascript
// Tăng thời gian expire của JWT
JWT_EXPIRES_IN=30d

// Hoặc implement refresh token
JWT_REFRESH_EXPIRE=90d
```

### 4.7. Lỗi Email Service (Gmail) trên Render

**Vấn đề:**
- Gmail SMTP bị block trên Render
- "Less secure app" không hoạt động

**Giải pháp:**
Chuyển sang SendGrid:
```javascript
// backend/src/config/email-new.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html
  });
};
```

### 4.8. Lỗi Duplicate Key Error

**Vấn đề:**
- Lỗi khi insert document với field unique đã tồn tại
- Error code: 11000

**Giải pháp:**
```javascript
// Global error handler
if (err.code === 11000) {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' đã tồn tại`;
  return res.status(400).json({ success: false, message });
}
```

### 4.9. Lỗi Socket.IO CORS

**Vấn đề:**
- Socket.IO connection bị block bởi CORS
- Real-time messaging không hoạt động

**Giải pháp:**
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, /\.vercel\.app$/],
    credentials: true
  }
});
```

### 4.10. Lỗi Build Frontend trên Vercel

**Vấn đề:**
- TypeScript build error
- Missing dependencies

**Giải pháp:**
```json
// package.json
{
  "scripts": {
    "build": "tsc -b && vite build"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.3"
  }
}
```

Cấu hình build command trên Vercel:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

---

## 5. QUY TRÌNH DEPLOY

### 5.1. Deploy Backend lên Render

**Bước 1: Chuẩn bị code**
- Đảm bảo có file `package.json` với script start:
  ```json
  {
    "scripts": {
      "start": "node src/server.js"
    }
  }
  ```
- Push code lên GitHub repository

**Bước 2: Tạo MongoDB Atlas Database**
- Truy cập https://cloud.mongodb.com
- Tạo cluster miễn phí
- Tạo database user và lấy connection string
- Whitelist all IPs (0.0.0.0/0) để Render có thể kết nối

**Bước 3: Tạo Web Service trên Render**
- Đăng nhập https://render.com
- Chọn "New" → "Web Service"
- Connect GitHub repository
- Cấu hình:
  - Name: `e-learning-backend`
  - Environment: `Node`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Instance Type: `Free`

**Bước 4: Thêm Environment Variables**
Vào tab "Environment", thêm các biến:
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elearning
JWT_SECRET=your_super_secret_jwt_key_32_chars_long
JWT_EXPIRES_IN=30d
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_live_xxxxx
VNPAY_TMN_CODE=xxxxx
VNPAY_HASH_SECRET=xxxxx
```

**Bước 5: Deploy**
- Click "Create Web Service"
- Render sẽ tự động build và deploy
- Lấy URL: `https://e-learning-backend.onrender.com`

**Lưu ý:**
- Free tier của Render sẽ sleep sau 15 phút không hoạt động
- Request đầu tiên sau khi sleep sẽ mất 30-60s để wake up

### 5.2. Deploy Frontend lên Vercel

**Bước 1: Chuẩn bị code**
- Tạo file `vercel.json`:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
- Cập nhật API URL trong code:
  ```typescript
  // src/services/api.ts
  const API_URL = import.meta.env.VITE_API_URL || 'https://e-learning-backend.onrender.com';
  ```

**Bước 2: Tạo file `.env.production`**
```
VITE_API_URL=https://e-learning-backend.onrender.com
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

**Bước 3: Deploy lên Vercel**
- Đăng nhập https://vercel.com
- Click "New Project"
- Import GitHub repository
- Cấu hình:
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

**Bước 4: Thêm Environment Variables**
Vào "Settings" → "Environment Variables":
```
VITE_API_URL=https://e-learning-backend.onrender.com
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

**Bước 5: Deploy**
- Click "Deploy"
- Vercel sẽ tự động build và deploy
- Lấy URL: `https://your-app.vercel.app`

**Bước 6: Cập nhật CORS trên Backend**
- Quay lại Render dashboard
- Cập nhật environment variables:
  ```
  CORS_ORIGIN=https://your-app.vercel.app
  FRONTEND_URL=https://your-app.vercel.app
  ```
- Redeploy backend service

### 5.3. Custom Domain (Optional)

**Vercel:**
- Vào "Settings" → "Domains"
- Thêm domain và cấu hình DNS theo hướng dẫn

**Render:**
- Vào "Settings" → "Custom Domain"
- Thêm domain và cấu hình CNAME record

### 5.4. Monitoring và Logs

**Render:**
- Tab "Logs" để xem server logs
- Tab "Metrics" để xem CPU/Memory usage

**Vercel:**
- Tab "Deployments" để xem lịch sử deploy
- Tab "Analytics" để xem traffic

### 5.5. Automatic Deployment

**GitHub Integration:**
- Mỗi lần push code lên GitHub (main branch)
- Vercel và Render sẽ tự động rebuild và redeploy
- Kiểm tra logs để đảm bảo deploy thành công

---

## 6. CÔNG NGHỆ SỬ DỤNG

### Backend
- **Node.js** v18+
- **Express.js** v4.18 - Web framework
- **MongoDB** v7.5 - NoSQL database
- **Mongoose** - ODM cho MongoDB
- **JWT** - Authentication
- **bcryptjs** - Hash password
- **Socket.IO** v4.8 - Real-time messaging
- **Multer** - File upload
- **GridFS** - Lưu trữ file lớn
- **Cloudinary** - Image hosting
- **SendGrid** - Email service
- **Stripe, VNPay, MoMo** - Payment gateways
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - CORS handling
- **express-rate-limit** - Rate limiting
- **swagger** - API documentation

### Frontend
- **React** v18.3 - UI library
- **TypeScript** v5.5 - Type safety
- **Vite** v5.4 - Build tool
- **React Router** v6.26 - Routing
- **Axios** v1.6 - HTTP client
- **Socket.IO Client** v4.8 - Real-time
- **Tailwind CSS** v3.4 - Styling
- **Framer Motion** v12.23 - Animations
- **Recharts** v3.5 - Data visualization
- **React Three Fiber** - 3D graphics
- **Headless UI** - Accessible components
- **Lucide React** - Icons

### DevOps
- **Render** - Backend hosting
- **Vercel** - Frontend hosting
- **MongoDB Atlas** - Database hosting
- **Cloudinary** - Media hosting
- **Git/GitHub** - Version control

---

## 7. TỔNG KẾT

Dự án E-Learning là một hệ thống học tập trực tuyến hoàn chỉnh với đầy đủ tính năng:
- ✅ Xác thực và phân quyền người dùng
- ✅ Quản lý khóa học và bài học
- ✅ Hệ thống thanh toán đa kênh
- ✅ Diễn đàn thảo luận và nhóm học tập
- ✅ Real-time messaging với Socket.IO
- ✅ Hệ thống chứng chỉ tự động
- ✅ Dashboard thống kê và phân tích
- ✅ Responsive design cho mobile
- ✅ Deploy production-ready

**Thành tựu đạt được:**
- Xây dựng 20+ collections MongoDB với quan hệ phức tạp
- Phát triển 100+ API endpoints RESTful
- Tích hợp 3 payment gateways (Stripe, VNPay, MoMo)
- Xử lý upload và streaming video lớn với GridFS
- Triển khai hệ thống real-time với Socket.IO
- Deploy thành công trên Render và Vercel
- Giải quyết các vấn đề CORS, validation, security

**Kỹ năng học được:**
- Full-stack development với MERN stack
- RESTful API design và documentation
- Database modeling và relationships
- Authentication & Authorization (JWT)
- File upload và cloud storage
- Payment gateway integration
- Real-time communication
- DevOps và deployment
- Error handling và debugging
- Performance optimization

---

**Ngày hoàn thành:** 28/11/2025  
**Repository:** https://github.com/quangtrung03/E-Learning  
**Live Demo:**
- Frontend: https://your-app.vercel.app
- Backend: https://e-learning-backend.onrender.com
- API Docs: https://e-learning-backend.onrender.com/api-docs
