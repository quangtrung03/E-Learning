# ⚠️ ARCHIVED - TÀI LIỆU ĐÃ LỖI THỜI

> **⚠️ CẢNH BÁO:** Tài liệu này đã lỗi thời. Week 1-3 đã hoàn thành tất cả các tasks.  
> **✅ ĐỌC TÀI LIỆU MỚI:** [PROJECT_STATUS.md](./PROJECT_STATUS.md)  
> **📌 Lý do archive:** Kế hoạch triển khai Week 1-4 - giờ đã complete Week 1-3.

---

# 📋 KẾ HOẠCH TRIỂN KHAI CHI TIẾT - E-LEARNING SYSTEM
**Version:** 1.0  
**Ngày:** 26/02/2026  
**Mục tiêu:** Hoàn thiện hệ thống để sẵn sàng demo/production

---

## 🎯 SCOPE OPTIONS

### Option A: Quick Demo (2-3 tuần)
**Target:** 5-10 users, demo features  
**Focus:** Fix critical blockers, basic UI completeness  
**Bỏ qua:** Optimization, caching, testing intensive

### Option B: Production Ready (6-8 tuần)
**Target:** 100+ users, real business  
**Focus:** Full features + optimization + testing  
**Include:** All phases below

---

## 📅 TIMELINE CHI TIẾT

### **WEEK 1: Backend Critical Fixes**

#### Day 1-2: Fix Analytics Placeholders (HIGH PRIORITY)
**File:** `backend/src/controllers/analyticsController.js`

**Tasks:**
- [ ] **getInstructorAnalytics** - Thống kê cho instructor dashboard
  ```javascript
  // Input: instructorId (from req.user)
  // Output: { totalRevenue, totalStudents, courseStats[], recentPayments[] }
  // Logic: Aggregate Payment + Enrollment data by instructor's courses
  ```

- [ ] **trackActivity** - Track user activity (page views, video watch time)
  ```javascript
  // Input: { activityType, courseId, lessonId, duration }
  // Output: { success: true }
  // Logic: Update or create LearningAnalytics record
  ```

- [ ] **getDashboardStats** - Stats for student dashboard
  ```javascript
  // Input: userId (from req.user)
  // Output: { coursesInProgress, completedCourses, totalTimeSpent, upcomingDeadlines[] }
  // Logic: Query Enrollment + Assignment + Submission
  ```

- [ ] **getEngagementMetrics** - Engagement data (daily active, completion rate)
  ```javascript
  // Input: courseId, dateRange
  // Output: { dailyActive[], completionRate, averageTimeSpent }
  // Logic: Aggregate LearningAnalytics by date
  ```

**Estimated Time:** 2 days (6-8 hours each)  
**Dependencies:** LearningAnalytics model (already exists)  
**Testing:** Postman tests for each endpoint

---

#### Day 3-4: Fix Study Group Placeholders (MEDIUM PRIORITY)

**File:** `backend/src/controllers/studyGroupController.js`

**Priority Functions:**
- [ ] **scheduleSession** - Schedule study session
  ```javascript
  // Input: { studyGroupId, title, description, startTime, duration, location/link }
  // Output: { session: { id, title, startTime, ... } }
  // Logic: Add to studyGroup.sessions array, send notifications
  ```

- [ ] **updateSession** - Update session details
- [ ] **deleteSession** - Cancel session

**Lower Priority (can skip for demo):**
- [ ] inviteToGroup - Email invitation (can use manual join)
- [ ] addResource - Upload files to group (can use messaging)
- [ ] removeResource

**Estimated Time:** 2 days  
**Note:** Nếu demo, chỉ làm scheduleSession

---

#### Day 5: Add Missing Validation

**Files to update:**
- `backend/src/controllers/courseController.js` - updateCourse
- `backend/src/controllers/lessonController.js` - updateLesson
- `backend/src/controllers/discussionController.js` - updateDiscussion

**Validation Rules:**
```javascript
// Example: courseController.updateCourse
const { body } = require('express-validator');

router.put('/:id', [
  body('title').optional().trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim().isLength({ min: 10 }),
  body('price').optional().isFloat({ min: 0 }),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
], updateCourse);
```

**Tasks:**
- [ ] Add express-validator rules to routes
- [ ] Add `validationResult` check in controllers
- [ ] Test invalid inputs

**Estimated Time:** 1 day

---

### **WEEK 2: Frontend Critical UIs**

#### Day 1-3: Discussion/Forum Pages

**Files to create:**

1. **`frontend/src/pages/DiscussionList.tsx`** (Day 1)
   ```typescript
   // Display discussions for a course
   // API: GET /api/courses/:courseId/discussions
   // Features:
   // - List discussions with title, author, reply count, likes
   // - Filter by category (general, question, announcement)
   // - Sort by latest/popular
   // - Search discussions
   // - "Create Discussion" button
   ```

2. **`frontend/src/pages/DiscussionDetail.tsx`** (Day 2)
   ```typescript
   // View single discussion + replies
   // API: GET /api/discussions/:id
   // Features:
   // - Show discussion content (with rich text)
   // - List replies (nested or flat)
   // - Like/unlike discussion & replies
   // - Add reply (rich text editor)
   // - Edit/delete own posts
   // - Pin discussion (instructor/admin only)
   ```

3. **`frontend/src/pages/DiscussionCreate.tsx`** (Day 3)
   ```typescript
   // Create new discussion
   // API: POST /api/discussions
   // Form fields:
   // - Title (required)
   // - Category select (general, question, announcement)
   // - Content (rich text editor - use react-quill)
   // - Tags (optional)
   ```

**UI Components to reuse:**
- Button, Card, Modal (already exist)
- Need: RichTextEditor component (install react-quill)

**Estimated Time:** 3 days

---

#### Day 4-5: Assignment Grading UI

**Files to create:**

1. **`frontend/src/pages/SubmissionList.tsx`** (Day 4)
   ```typescript
   // Instructor view all submissions for an assignment
   // API: GET /api/assignments/:assignmentId/submissions
   // Features:
   // - List students with submission status
   // - Filter: submitted/graded/pending
   // - Sort by submission date/score
   // - Click to grade
   ```

2. **`frontend/src/pages/AssignmentGrading.tsx`** (Day 4-5)
   ```typescript
   // Grade a submission
   // API: PUT /api/submissions/:id/grade
   // Features:
   // - Show student's submission (text/files)
   // - Score input (0-100)
   // - Feedback textarea
   // - Grade select (A/B/C/D/F - auto based on score)
   // - Submit grading button
   ```

**Update existing:**
- **`AssignmentDetail.tsx`** - Add submission form for students
  - File upload (if assignment allows)
  - Text answer textarea
  - Submit button

**Estimated Time:** 2 days

---

### **WEEK 3: Admin & Management UIs**

#### Day 1-2: Admin Review Management

**File to create:**
**`frontend/src/pages/AdminReviewManagement.tsx`**

```typescript
// Admin moderate reviews
// API: GET /api/admin/reviews/pending
// Features:
// - List pending reviews (course, author, rating, content)
// - Filter by course/status
// - Actions: Approve/Reject with reason
// - Show rejection reason history
```

**Update:**
- **`AdminDashboard.tsx`** - Add "Pending Reviews" count card

**Estimated Time:** 2 days

---

#### Day 3-4: Coupon Management

**Files to create:**

1. **`frontend/src/pages/CouponList.tsx`** (Day 3)
   ```typescript
   // Admin/instructor view all coupons
   // API: GET /api/coupons
   // Features:
   // - List coupons (code, discount, usage, expiry, status)
   // - Filter: active/expired/used
   // - Edit/delete/deactivate actions
   ```

2. **`frontend/src/pages/CouponCreate.tsx`** (Day 4)
   ```typescript
   // Create/edit coupon
   // API: POST /api/coupons or PUT /api/coupons/:id
   // Form:
   // - Code (auto-generate option)
   // - Discount type (percentage/fixed)
   // - Discount value
   // - Usage limit (total & per user)
   // - Valid from/to dates
   // - Applicable courses (all or specific)
   // - Min purchase amount
   ```

**Estimated Time:** 2 days

---

#### Day 5: Bug Fixes & Testing

- [ ] Fix any bugs found in Week 1-2
- [ ] Manual testing của tất cả pages mới
- [ ] Integration testing (test full workflows)

**Estimated Time:** 1 day

---

### **WEEK 4: Polish & Documentation** (DEMO READY)

#### Day 1-2: Error Handling & UX

- [ ] Add loading states to all pages
- [ ] Add error boundaries (catch React errors)
- [ ] Add toast notifications (success/error)
- [ ] Validate forms client-side
- [ ] Add confirmation dialogs (delete actions)

#### Day 3-4: Documentation

- [ ] Update API documentation (Swagger)
- [ ] Create USER_GUIDE.md
  - Student guide
  - Instructor guide
  - Admin guide
- [ ] Create DEPLOYMENT_GUIDE.md
- [ ] Update README.md với new features

#### Day 5: Final Testing

- [ ] Full system test (all workflows)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive check
- [ ] Fix any critical bugs

**⭐ DEMO READY AFTER WEEK 4**

---

## 🚀 EXTENDED PHASES (Production)

### **WEEK 5-6: Performance Optimization**

#### Caching Layer
- [ ] Install Redis or node-cache
- [ ] Cache courses list (TTL: 10 minutes)
- [ ] Cache course detail (TTL: 5 minutes)
- [ ] Cache categories (TTL: 30 minutes)
- [ ] Implement cache invalidation on updates

#### Database Optimization
- [ ] Add indexes to Course model:
  ```javascript
  courseSchema.index({ category: 1, status: 1 });
  courseSchema.index({ instructor: 1 });
  courseSchema.index({ createdAt: -1 });
  ```
- [ ] Add compound index to Enrollment:
  ```javascript
  enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
  ```
- [ ] Optimize N+1 queries:
  - Refactor `getMyRevenue` - use aggregation pipeline
  - Refactor `getMyStudents` - batch queries

#### Frontend Optimization
- [ ] Code splitting (React.lazy)
- [ ] Image optimization (use next/image or similar)
- [ ] Bundle size analysis (webpack-bundle-analyzer)
- [ ] Lazy load components below fold

---

### **WEEK 7-8: Security & Quality**

#### Security Hardening
- [ ] Rate limiting for all auth endpoints
- [ ] Input sanitization (DOMPurify on frontend)
- [ ] CSRF protection (csurf middleware)
- [ ] Audit authorization logic (ensure only owner/admin can edit)
- [ ] SQL injection check (not applicable for MongoDB, but check raw queries)

#### Testing
- [ ] Unit tests for controllers (Jest)
  - Test each controller function
  - Mock database calls
- [ ] Integration tests (Supertest)
  - Test API routes end-to-end
- [ ] Frontend component tests (React Testing Library)
- [ ] E2E tests for critical flows (Playwright)
  - User registration → course purchase → enrollment
  - Instructor create course → submit for approval → admin approve

#### Monitoring & Logging
- [ ] Integrate Winston logger
- [ ] Add error tracking (Sentry)
- [ ] Set up health check endpoint
- [ ] Add performance monitoring (e.g., New Relic)

---

### **WEEK 9-10: Advanced Features** (Optional)

#### Notification System
- [ ] Create Notification model
- [ ] notificationController.js (CRUD)
- [ ] Real-time notifications via Socket.IO
- [ ] Email notifications (already have emailService)
- [ ] Frontend NotificationDropdown component
- [ ] Mark as read/unread
- [ ] Notification preferences

#### Certificate Enhancement
- [ ] PDF generation (jsPDF + canvas)
- [ ] Custom certificate templates
- [ ] Public verification page
- [ ] Social sharing (LinkedIn, Facebook)

#### Advanced Search
- [ ] Elasticsearch integration (or use MongoDB text search)
- [ ] Autocomplete API
- [ ] Search history
- [ ] Filters: price range, rating, duration
- [ ] Sort: relevance, rating, popularity, newest

---

## 📊 RESOURCE ESTIMATION

### Development Team:
**Option 1: Solo Developer**
- **Demo (4 weeks):** 1 full-stack developer
- **Production (10 weeks):** 1 full-stack developer

**Option 2: Team**
- **Demo (2 weeks):** 1 backend + 1 frontend developer
- **Production (6 weeks):** 1 backend + 1 frontend + 1 QA

### Time Breakdown (Solo):

**Demo (160 hours total):**
- Backend fixes: 40 hours
- Frontend UIs: 80 hours
- Testing & bugs: 20 hours
- Documentation: 20 hours

**Production (400 hours total):**
- Demo scope: 160 hours
- Optimization: 80 hours
- Security & testing: 100 hours
- Advanced features: 60 hours

---

## 🎯 DEFINITION OF DONE

### Demo Ready Checklist:
- [x] All placeholder functions implemented
- [x] Discussion forum full CRUD + UI
- [x] Assignment grading UI working
- [x] Admin review management working
- [x] Coupon management working
- [x] All validation in place
- [x] No 5xx errors in normal flows
- [x] Mobile responsive (basic)
- [x] Documentation complete

### Production Ready Checklist:
- [x] Demo ready checklist
- [x] Caching layer implemented
- [x] Database optimized (indexes + query optimization)
- [x] Security hardened (rate limit + sanitization + CSRF)
- [x] Test coverage > 60%
- [x] Error monitoring (Sentry)
- [x] Load tested (100+ concurrent users)
- [x] Deployment guide complete
- [x] Backup & recovery plan

---

## 🚀 DEPLOYMENT CHECKLIST

### Before First Deploy:
- [ ] Set up MongoDB Atlas (already done ✅)
- [ ] Configure Cloudinary (already done ✅)
- [ ] Set up SendGrid (already done ✅)
- [ ] Configure payment gateways (Stripe/VNPay/MoMo)
- [ ] Set environment variables in hosting platform
- [ ] Set up SSL certificate
- [ ] Configure CORS properly
- [ ] Set up domain & DNS

### Deploy Backend (Render):
- [ ] Connect GitHub repo
- [ ] Set build command: `npm install`
- [ ] Set start command: `node src/server.js`
- [ ] Add environment variables (.env.production)
- [ ] Deploy & test health endpoint

### Deploy Frontend (Vercel):
- [ ] Connect GitHub repo
- [ ] Set build command: `npm run build`
- [ ] Set output directory: `dist`
- [ ] Add environment variables (VITE_API_URL)
- [ ] Configure redirects (_redirects file)
- [ ] Deploy & test

### Post-Deploy:
- [ ] Test full registration flow
- [ ] Test payment flow (Stripe test mode)
- [ ] Test video upload/playback
- [ ] Test email sending
- [ ] Monitor logs for errors
- [ ] Set up uptime monitoring (UptimeRobot)

---

## 📞 SUPPORT & MAINTENANCE

### Weekly Tasks:
- Review error logs
- Check uptime & performance
- Backup database (MongoDB Atlas automatic)
- Review user feedback

### Monthly Tasks:
- Security updates (npm audit fix)
- Database cleanup (old sessions, expired tokens)
- Performance analysis
- Feature usage analytics

---

## 🎉 SUCCESS METRICS

### Demo Phase:
- ✅ System runs without crashes
- ✅ Core features demonstrated successfully
- ✅ User feedback collected

### Production Phase:
- 📈 Uptime > 99.5%
- 📈 Page load time < 3 seconds
- 📈 Zero critical security vulnerabilities
- 📈 User satisfaction > 4/5
- 📈 Course completion rate > 30%

---

**Next Action:** Xác định scope (Demo hay Production) và bắt đầu Week 1!
