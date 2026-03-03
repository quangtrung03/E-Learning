# E-Learning Platform - AI Coding Agent Instructions

## Project Overview
Full-stack E-Learning platform with course management, real-time messaging, payment processing, and analytics. Backend uses Node.js/Express/MongoDB, frontend uses React/TypeScript/Vite.

## Architecture & Key Patterns

### Backend Structure (`backend/src/`)
- **Models**: Mongoose schemas with Vietnamese validation messages and virtuals for relationships
- **Controllers**: Business logic following `async (req, res)` pattern with try-catch error handling
- **Routes**: Express routes with middleware chain: `protect` → validation → controller
- **Services**: Shared business logic (notifications, cron jobs, email)
- **Middleware**: `auth.js` (JWT + email verification check), `upload.js` (Multer + Cloudinary), `validation.js`

### Authentication Flow
1. Users register → email verification required before accessing protected routes
2. JWT stored client-side, sent via `Authorization: Bearer <token>` header
3. `protect` middleware validates JWT + checks `emailVerified` + `isActive` flags
4. Role system: `isAdmin` boolean field (no complex roles)
5. Email verification uses time-limited tokens in `EmailVerification` model

### Course & Content Management
- **Course states**: `draft` → `pending` (submitted for approval) → `approved` → `published`
- **Instructor workflow**: Create course → Add lessons → Submit for approval → Admin approves → Publish
- **Video storage**: GridFS for video lessons (large files), Cloudinary for images (thumbnails, avatars)
- **Enrollment tracking**: Separate `Enrollment` model with progress tracking

### File Upload Patterns
```javascript
// Images → Cloudinary (courseThumbnail, avatar, category icons)
uploadImage.single('image') → uploadController → cloudinary.uploader.upload()

// Videos → GridFS (lesson videos)
Stored in MongoDB GridFS, accessed via /api/files/video/:id route
```

### Real-time Features (Socket.IO)
- **Initialization**: Single Socket.IO instance created in `server.js`, shared with `notificationService`
- **Messages**: Real-time chat via `messageController.js` + Socket.IO events
- **Notifications**: Broadcast via `notificationService.sendNotification()`
- **Connection**: Client connects with JWT auth query param

### Payment Integration
- **Providers**: Stripe, VNPay, MoMo configured in `paymentController.js`
- **Coupon system**: `Coupon` model with discount percentages and usage limits
- **Flow**: Create payment → Redirect to provider → Return callback → Update enrollment

### Database Relationships
```javascript
User ← createdCourses → Course ← instructor
User ← Enrollment → Course (many-to-many)
Course ← lessons → Lesson
Lesson ← assignments → Assignment ← submissions → Submission
Course ← reviews → Review (with multi-criteria ratings)
```

## Development Workflows

### Running the App
```bash
# Backend (PowerShell)
cd backend; npm run dev              # Development without cron jobs
npm run dev:cron                     # Development with cron jobs enabled
npm run start                        # Production mode

# Frontend (PowerShell)
cd frontend; npm run dev             # Vite dev server on :5173
npm run build                        # TypeScript + Vite build
```

### Database Operations
```bash
cd backend
node scripts/create-platform-admin.js    # Create first admin user
node scripts/seed-production.js          # Seed categories + sample data
node scripts/clean-database.js           # Clear all collections
```

### Environment Setup
- Backend: Copy `.env.example` → `.env`, configure MongoDB, JWT_SECRET, Cloudinary, Resend
- Frontend: Copy `.env.example` → `.env`, set `VITE_API_URL` (defaults to localhost:5000)
- **Critical**: Email verification blocks access - configure Resend (see `DOCS.md`) hoặc set `emailVerified: true` trong DB để test nhanh

## Code Conventions

### Error Handling
```javascript
// Controllers: Always wrap in try-catch with success/error response format
try {
  // Business logic
  res.status(200).json({ success: true, data: result });
} catch (error) {
  res.status(500).json({ success: false, message: 'Lỗi message' });
}
```

### Validation
- Use `express-validator` in route files: `body('field').trim().isLength({min, max}).withMessage('Message')`
- Validation messages in **Vietnamese**
- Check `validationResult(req)` at start of controllers

### Model Conventions
- Vietnamese field names and error messages (e.g., `'Vui lòng nhập email'`)
- Use `select: false` for sensitive fields (password)
- Implement virtuals for computed fields and relationships
- Add indexes for frequently queried fields

### API Response Format
```javascript
// Success
{ success: true, data: {}, count: 10, pagination: {} }

// Error  
{ success: false, message: 'Vietnamese error message', errors: [] }
```

### Frontend Patterns
- **API calls**: Use `src/services/api.ts` axios instance (auto-adds JWT token)
- **Auth context**: `useAuth()` hook provides `isAuthenticated`, `user`, `login`, `logout`
- **Protected routes**: `<ProtectedRoute>` wrapper checks authentication
- **State**: Context API for auth/theme, local state for components (no Redux)

## Critical Implementation Details

### Permission Checks
```javascript
// Middleware chain example from courseRoutes.js
router.patch('/:id', protect, requireOwnershipOrAdmin, updateCourse);

// Any user can create courses (become instructor)
// Only course owner or admin can edit/delete
```

### Cron Jobs
- Controlled via `ENABLE_CRON` env var (disable in development to save resources)
- Implemented in `services/cronJobService.js`
- Use `node-cron` for scheduling

### CORS Configuration
- Production: Whitelist specific origins + Vercel domains
- Development: Allow localhost:5173, localhost:3000
- Configured in `server.js` with environment-based logic

### Swagger Documentation
- Access at `/api-docs` when server running
- Configured in `config/swagger.js`
- Use JSDoc comments in route files for endpoint documentation

## Common Tasks

### Adding New Feature
1. Create model in `models/` with Vietnamese validation
2. Create controller in `controllers/` with try-catch pattern
3. Create routes in `routes/` with validation middleware
4. Import route in `server.js` under existing route groups
5. Add frontend service function in `src/services/api.ts`
6. Create/update React components and pages

### Adding New Model Relationship
1. Add ref field to schema: `instructor: { type: mongoose.Schema.ObjectId, ref: 'User' }`
2. Use `.populate('instructor', 'name avatar')` in queries
3. Consider adding virtual for reverse relationship

### Debugging Issues
- Backend logs: Check terminal for emoji-prefixed logs (🌐, 📋, ❌)
- Frontend: Check browser console for API config logs
- Common issue: Email not verified → manually update DB or configure Resend
- Socket.IO: Check connection in browser devtools Network → WS tab

## Testing Strategy
- Test scripts in `backend/scripts/` directory
- Manual testing via Swagger UI at `/api-docs`
- No automated test suite currently implemented

## Deployment Notes
- Backend deploys to Render (use `.env.production` config)
- Frontend deploys to Vercel (auto-detected Vite setup)
- MongoDB Atlas for production database
- Cloudinary for file hosting
- Resend required for email functionality in production
