# ⚠️ ARCHIVED - TÀI LIỆU ĐÃ LỖI THỜI

> **⚠️ CẢNH BÁO:** Tài liệu này đã lỗi thời. Tất cả checklist items đã completed.  
> **✅ ĐỌC TÀI LIỆU MỚI:** [PROJECT_STATUS.md](./PROJECT_STATUS.md)  
> **📌 Lý do archive:** Checklist functions cần implement - giờ đã 100% done.

---

# 🎯 QUICK REFERENCE - TÍNH NĂNG CẦN LÀM

**Last Updated:** 26/02/2026  
**Purpose:** Checklist nhanh cho developer

---

## 🔴 CRITICAL - LÀM NGAY (Week 1-2)

### Backend: Fix Placeholder Functions

#### analyticsController.js - 4 functions ưu tiên cao:
```javascript
✅ IMPLEMENTED: getUserAnalytics, getCourseAnalytics, updateLearningProgress, 
                setLearningGoals, getRevenueAnalytics

❌ NEED TO IMPLEMENT (8 functions):
1. getInstructorAnalytics() - Dashboard stats cho instructor
2. trackActivity() - Track user activity (views, watch time)
3. getDashboardStats() - Stats cho student dashboard
4. getEngagementMetrics() - Daily active users, completion rates
5. updateProgress() - Update course progress
6. generateReport() - Export analytics reports
7. getLearningPath() - Recommend learning path
8. exportAnalytics() - Export to CSV/Excel
```

#### studyGroupController.js - 3 functions ưu tiên:
```javascript
✅ IMPLEMENTED: createStudyGroup, getStudyGroups, getStudyGroupsByCourse, 
                getStudyGroup, joinStudyGroup, leaveStudyGroup, 
                updateStudyGroup, deleteStudyGroup, managePendingMember

❌ NEED TO IMPLEMENT (7 functions):
Priority 1:
1. scheduleSession() - Schedule study sessions
2. updateSession() - Edit session
3. deleteSession() - Cancel session

Priority 2 (can skip for demo):
4. inviteToGroup() - Email invite
5. approveJoinRequest() - Approve join
6. addResource() - Upload files
7. removeResource() - Delete files
```

**Time Estimate:** 3-4 days  
**Priority:** Critical (tránh 501 errors)

---

### Backend: Add Validation

**Files to update:**
```javascript
// courseController.js - updateCourse()
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('price').optional().isFloat({ min: 0 }),
], updateCourse);

// lessonController.js - updateLesson()
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 3 }),
  body('duration').optional().isInt({ min: 1 }),
], updateLesson);

// discussionController.js - updateDiscussion()
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 5 }),
  body('content').optional().trim().isLength({ min: 10 }),
], updateDiscussion);
```

**Time Estimate:** 1 day  
**Priority:** High

---

### Frontend: Discussion Pages (3 pages)

**Create new files:**
```
frontend/src/pages/
  ├── DiscussionList.tsx        ← List discussions by course
  ├── DiscussionDetail.tsx      ← View discussion + replies
  └── DiscussionCreate.tsx      ← Create new discussion
```

**API endpoints (already exist):**
- GET /api/courses/:courseId/discussions
- GET /api/discussions/:id
- POST /api/discussions
- POST /api/discussions/:id/reply
- PUT /api/discussions/:id/like

**Components needed:**
- RichTextEditor (install react-quill)
- ReplyList component
- LikeButton component

**Time Estimate:** 3 days  
**Priority:** Critical (backend ready, no UI)

---

### Frontend: Assignment Grading (2 pages)

**Create new files:**
```
frontend/src/pages/
  ├── SubmissionList.tsx        ← Instructor view submissions
  └── AssignmentGrading.tsx     ← Grade submission form
```

**Update existing:**
```
frontend/src/pages/
  └── AssignmentDetail.tsx      ← Add submission form for students
```

**API endpoints (need to check):**
- GET /api/assignments/:id/submissions
- PUT /api/submissions/:id/grade
- POST /api/assignments/:id/submit

**Time Estimate:** 2 days  
**Priority:** High (instructor workflow)

---

## 🟡 IMPORTANT - LÀM SAU (Week 3)

### Frontend: Admin Tools

**1. AdminReviewManagement.tsx**
```typescript
// Moderate pending reviews
// API: GET /api/admin/reviews/pending
// API: PUT /api/reviews/:id/moderate
Features:
- List pending reviews
- Approve/reject with reason
- Filter by course/status
```
**Time:** 1-2 days

---

**2. CouponManagement.tsx (2 pages)**
```typescript
// CouponList.tsx - List all coupons
// API: GET /api/coupons

// CouponCreate.tsx - Create/edit coupon
// API: POST /api/coupons
// API: PUT /api/coupons/:id
Features:
- CRUD coupons
- Set discount type/value
- Usage limits
- Date range
- Course restrictions
```
**Time:** 2 days

---

### Backend: Optimization

**Fix N+1 Queries:**
```javascript
// courseController.js - getMyRevenue()
// ❌ BAD:
for (const course of myCourses) {
  const payments = await Payment.find({ course: course._id });
}

// ✅ GOOD:
const courseIds = myCourses.map(c => c._id);
const allPayments = await Payment.find({ course: { $in: courseIds } });
// Then group by courseId
```

**Files to refactor:**
- courseController.js: getMyRevenue(), getMyStudents()
- anyController with loops doing queries

**Time:** 2 days  
**Priority:** Medium (performance)

---

**Add Database Indexes:**
```javascript
// Course model
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ createdAt: -1 });

// Enrollment model
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1 });

// Payment model
paymentSchema.index({ user: 1 });
paymentSchema.index({ course: 1 });
paymentSchema.index({ status: 1 });

// Discussion model
discussionSchema.index({ course: 1, status: 1 });
```

**Time:** 1 day  
**Priority:** Medium

---

## 🟢 NICE TO HAVE - Optimization (Week 5+)

### Caching Layer
```javascript
// Install: npm install node-cache
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache courses list
router.get('/courses', async (req, res) => {
  const cacheKey = `courses_${JSON.stringify(req.query)}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  
  const courses = await Course.find(query);
  cache.set(cacheKey, courses);
  res.json(courses);
});

// Invalidate on update
router.put('/courses/:id', async (req, res) => {
  await Course.findByIdAndUpdate(req.params.id, req.body);
  cache.flushAll(); // or delete specific keys
});
```

**Endpoints to cache:**
- GET /api/courses (10 min)
- GET /api/courses/:id (5 min)
- GET /api/categories (30 min)
- GET /api/instructors (15 min)

**Time:** 2-3 days  
**Priority:** Low (only needed for high traffic)

---

### Notification System
**New files to create:**
```
backend/src/
  ├── models/Notification.js
  └── controllers/notificationController.js
  
frontend/src/
  └── components/NotificationDropdown.tsx
```

**Features:**
- Real-time notifications (Socket.IO)
- Email notifications (SendGrid)
- Notification types: course_approved, new_assignment, new_message, etc.
- Mark as read/unread

**Time:** 3-5 days  
**Priority:** Low (nice to have)

---

## 📊 TESTING CHECKLIST

### Manual Testing (Week 3-4)
- [ ] User registration → email verification → login
- [ ] Instructor create course → upload lessons/videos → submit for approval
- [ ] Admin approve/reject course
- [ ] Student enroll course (free + paid)
- [ ] Student watch videos → complete lessons → track progress
- [ ] Student submit assignment → instructor grade
- [ ] Create discussion → reply → like
- [ ] Join study group → schedule session
- [ ] Send messages (1-on-1)
- [ ] Generate certificate (after 80% completion)
- [ ] Admin manage users (ban/unban)
- [ ] Apply coupon → checkout → payment success

### Automated Testing (Week 7-8)
- [ ] Unit tests: Controllers (Jest + Supertest)
- [ ] Integration tests: Full API flows
- [ ] E2E tests: Critical user journeys (Playwright)
- [ ] Coverage goal: >60%

---

## 🚀 DEPLOYMENT CHECKLIST

### Environment Setup
- [x] MongoDB Atlas configured ✅
- [x] Cloudinary API keys ✅
- [ ] SendGrid API key (check if working)
- [ ] Stripe API keys (test + live)
- [ ] VNPay credentials (if using)
- [ ] MoMo credentials (if using)

### Hosting
**Backend (Render):**
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Deploy + test health endpoint

**Frontend (Vercel):**
- [ ] Connect GitHub repo
- [ ] Set VITE_API_URL
- [ ] Configure redirects
- [ ] Deploy + test

### Post-Deploy
- [ ] Test all critical flows
- [ ] Check error logs
- [ ] Set up uptime monitoring
- [ ] Set up error tracking (Sentry)

---

## 🎯 PRIORITY SUMMARY

**THIS WEEK (Week 1):**
1. Implement 8 analytics functions (2 days)
2. Implement 3 study group functions (1 day)
3. Add validation (1 day)
4. Start Discussion UI (1 day)

**NEXT WEEK (Week 2):**
1. Complete Discussion UI (2 days)
2. Assignment Grading UI (2 days)
3. Bug fixes (1 day)

**WEEK 3:**
1. Admin tools (3 days)
2. Fix N+1 queries (1 day)
3. Add indexes (1 day)

**WEEK 4:**
1. Testing + bug fixes (3 days)
2. Documentation (2 days)

**🎉 DEMO READY AFTER WEEK 4**

---

## 📁 FILE STRUCTURE REFERENCE

**Backend controllers to update:**
```
backend/src/controllers/
  ├── analyticsController.js    ← Add 8 functions
  ├── studyGroupController.js   ← Add 7 functions
  ├── courseController.js       ← Add validation to updateCourse
  ├── lessonController.js       ← Add validation to updateLesson
  └── discussionController.js   ← Add validation to updateDiscussion
```

**Frontend pages to create:**
```
frontend/src/pages/
  ├── DiscussionList.tsx        ← NEW
  ├── DiscussionDetail.tsx      ← NEW
  ├── DiscussionCreate.tsx      ← NEW
  ├── SubmissionList.tsx        ← NEW
  ├── AssignmentGrading.tsx     ← NEW
  ├── AdminReviewManagement.tsx ← NEW
  └── CouponManagement.tsx      ← NEW (or split to 2 files)
```

**Models to add indexes:**
```
backend/src/models/
  ├── Course.js
  ├── Enrollment.js
  ├── Payment.js
  └── Discussion.js
```

---

## 🔗 USEFUL LINKS

**Documentation:**
- [Main Feature Audit](./FEATURE_AUDIT_REPORT.md) - Chi tiết đầy đủ
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Kế hoạch 10 tuần
- [Migration Test Guide](./TEST_MIGRATION.md) - Test video migration
- [System Analysis](./SYSTEM_ANALYSIS.md) - Tổng quan hệ thống

**External Docs:**
- [Mongoose Indexes](https://mongoosejs.com/docs/guide.html#indexes)
- [Express Validator](https://express-validator.github.io/docs)
- [React Quill](https://github.com/zenoamaro/react-quill) - Rich text editor
- [Recharts](https://recharts.org/) - Charts library

---

**Bắt đầu từ đâu:**
1. Đọc [FEATURE_AUDIT_REPORT.md](./FEATURE_AUDIT_REPORT.md) để hiểu toàn bộ vấn đề
2. Chọn scope: Demo (4 tuần) hay Production (10 tuần)
3. Bắt đầu Week 1: Implement placeholder functions

**Câu hỏi:** Có thắc mắc gì về implementation không? Cần chi tiết thêm phần nào?
