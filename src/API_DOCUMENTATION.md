# 📚 3D Learning Platform — Complete API Documentation

> **Build Status:** ✅ Build Succeeded (0 Errors)  
> **Tests:** ✅ 55/55 Passed  
> **Architecture:** Modular Monolith — Clean Architecture + CQRS (MediatR)  
> **Auth:** JWT Bearer + Refresh Token Rotation  
> **Base URL:** `https://localhost:7xxx/api`

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Authentication & Identity](#1-authentication--identity)
3. [Course Catalog (Public)](#2-course-catalog-public)
4. [Instructor Course Management](#3-instructor-course-management)
5. [Shopping Cart & Checkout](#4-shopping-cart--checkout)
6. [Orders & Payments](#5-orders--payments)
7. [Enrollments & Student Dashboard](#6-enrollments--student-dashboard)
8. [Learning & Progress](#7-learning--progress)
9. [Quizzes](#8-quizzes)
10. [Reviews](#9-reviews)
11. [Community (Q&A)](#10-community-qa-discussions)
12. [CMS (Home Page)](#11-cms-home-page--newsletter)
13. [Admin Panel](#12-admin-panel)
14. [Admin Payments](#13-admin-payments--coupons--enrollments)
15. [Payment verification](#14-payment-verification)

---

## System Overview

### Modules
| Module | Responsibility |
|--------|---------------|
| **Identity** | Registration, login, JWT, refresh tokens, password reset, profile |
| **Catalog** | Courses, sections, lessons, assets, categories, reviews, instructors |
| **Payments** | Cart, InstaPay manual checkout, receipt review, orders, coupons, and refunds |
| **Learning** | Enrollments, progress tracking, certificates, downloads |
| **Quizzes** | Quiz CRUD, attempts, grading |
| **Community** | Discussion posts, replies (Q&A per course/lesson) |
| **CMS** | Home page content, newsletter subscriptions |
| **Admin** | Statistics, user management, course approval, review moderation |

### Roles
| Role | Description |
|------|-------------|
| `Student` | Default role. Can browse, purchase, learn, take quizzes, review courses |
| `Instructor` | Can create/manage courses, sections, lessons, quizzes |
| `Admin` | Full access: approve courses, moderate reviews, manage users, CMS, refunds |

### Authentication
All protected endpoints require `Authorization: Bearer {jwt_token}` header.

---

## 1. Authentication & Identity

### `POST /api/auth/register`
Register a new user (auto-assigned Student role).

**Request Body:**
```json
{
  "fullName": "Ahmed Mohamed",
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}
```
**Response (200):**
```json
{ "userId": "guid", "message": "Registration successful." }
```

---

### `POST /api/auth/login`
Authenticate and receive JWT + refresh token.

**Request Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}
```
**Response (200):**
```json
{
  "succeeded": true,
  "accessToken": "eyJhbG...",
  "refreshToken": "base64-string",
  "expiresAt": "2026-10-15T18:00:00Z",
  "userId": "guid",
  "email": "ahmed@example.com",
  "fullName": "Ahmed Mohamed",
  "roles": ["Student"]
}
```

---

### `POST /api/auth/refresh`
Rotate the access + refresh token pair.

**Request Body:**
```json
{
  "accessToken": "expired-jwt",
  "refreshToken": "current-refresh-token"
}
```
**Response (200):** Same shape as login response with new tokens.

---

### `POST /api/auth/revoke` 🔒
Revoke a refresh token (logout/stolen-token).

**Request Body:**
```json
{ "refreshToken": "token-to-revoke" }
```
**Response (200):**
```json
{ "message": "Token revoked successfully." }
```

---

### `POST /api/auth/forgot-password` ⏱️ Rate Limited (3/min)
Request password reset OTP via email.

**Request Body:**
```json
{ "email": "ahmed@example.com" }
```
**Response (200):**
```json
{ "succeeded": true, "message": "OTP sent to your email." }
```

---

### `POST /api/auth/reset-password`
Verify OTP and set new password.

**Request Body:**
```json
{
  "email": "ahmed@example.com",
  "otpCode": "123456",
  "newPassword": "NewSecurePass123!"
}
```
**Response (200):**
```json
{ "succeeded": true, "message": "Password reset successfully." }
```

---

### `GET /api/auth/me` 🔒
Get current authenticated user details.

**Response (200):**
```json
{
  "id": "guid",
  "fullName": "Ahmed Mohamed",
  "email": "ahmed@example.com",
  "avatarUrl": "https://...",
  "bio": "3D Artist",
  "roles": ["Student"]
}
```

---

### `PUT /api/auth/me` 🔒
Update user profile (partial update).

**Request Body:**
```json
{
  "fullName": "Ahmed M.",
  "avatarUrl": "https://cdn.example.com/avatar.jpg",
  "bio": "Senior 3D Architect"
}
```
**Response (200):** Updated user object.

---

### `PUT /api/auth/me/password` 🔒
Change password (requires current password).

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```
**Response (200):**
```json
{ "message": "Password changed successfully." }
```

---

## 2. Course Catalog (Public)

### `GET /api/categories`
List all course categories.

**Response (200):**
```json
[
  { "id": "guid", "name": "3D Architecture", "slug": "3d-architecture", "displayOrder": 1 }
]
```

---

### `GET /api/software-tags`
List all software tags (3ds Max, V-Ray, Corona, etc.).

**Response (200):**
```json
[
  { "id": "guid", "name": "3ds Max", "slug": "3ds-max" }
]
```

---

### `GET /api/courses`
Search, filter, and paginate published courses.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `Search` | string? | Search by title |
| `CategoryId` | Guid? | Filter by category |
| `Level` | enum? | `Beginner`, `Intermediate`, `Advanced` |
| `MinPrice` | decimal? | Min price filter |
| `MaxPrice` | decimal? | Max price filter |
| `SortBy` | string? | `price`, `rating`, `newest` |
| `Page` | int | Page number (default 1) |
| `PageSize` | int | Items per page (default 12) |

**Response (200):**
```json
{
  "items": [
    {
      "id": "guid",
      "title": "Mastering V-Ray Lighting",
      "slug": "mastering-v-ray-lighting",
      "subtitle": "...",
      "instructorName": "Adham",
      "categoryName": "3D Architecture",
      "price": 199.99,
      "discountPrice": 149.99,
      "level": "Intermediate",
      "status": "Published",
      "averageRating": 4.8,
      "totalReviews": 42,
      "enrolledStudentsCount": 150,
      "thumbnailUrl": "https://..."
    }
  ],
  "totalCount": 25,
  "page": 1,
  "pageSize": 12
}
```

---

### `GET /api/courses/{slug}`
Get full course details by slug (sections, lessons, instructor info).

**Response (200):**
```json
{
  "id": "guid",
  "title": "Mastering V-Ray Lighting",
  "slug": "mastering-v-ray-lighting",
  "description": "...",
  "instructorId": "guid",
  "instructorName": "Adham",
  "price": 199.99,
  "discountPrice": 149.99,
  "averageRating": 4.8,
  "totalReviews": 42,
  "totalDurationMinutes": 480,
  "sections": [
    {
      "id": "guid",
      "title": "Section 1: Intro",
      "order": 1,
      "lessons": [
        {
          "id": "guid",
          "title": "Lesson 1",
          "durationMinutes": 25,
          "isPreview": true,
          "videoUrl": "https://...",
          "order": 1,
          "type": "Video"
        }
      ]
    }
  ]
}
```

---

### `GET /api/courses/{courseId}/reviews`
Get approved reviews for a course (paginated).

**Query Params:** `page` (int), `pageSize` (int)

**Response (200):**
```json
{
  "items": [
    { "id": "guid", "studentName": "Hazem", "rating": 5, "comment": "Amazing!", "createdAt": "..." }
  ],
  "totalCount": 15,
  "page": 1,
  "pageSize": 10
}
```

---

### `GET /api/courses/{slug}/preview/{lessonId}`
Get preview lesson playback URL (no auth needed).

**Response (200):**
```json
{ "lessonId": "guid", "title": "Intro", "videoUrl": "https://...", "durationMinutes": 10 }
```

---

### `GET /api/instructors`
List all instructors with published courses.

**Response (200):**
```json
[
  { "id": "guid", "fullName": "Adham", "bio": "...", "avatarUrl": "...", "totalCourses": 5, "averageRating": 4.7 }
]
```

---

### `GET /api/instructors/{id}`
Get instructor profile with their published courses.

**Response (200):** Full instructor profile + course list.

---

## 3. Instructor Course Management 🔒 `Instructor,Admin`

### `POST /api/instructor/courses`
Create a new course draft.

**Request Body:**
```json
{
  "title": "Corona Renderer Masterclass",
  "subtitle": "Complete guide",
  "description": "Full course...",
  "categoryId": "guid",
  "level": "Intermediate",
  "price": 299.99,
  "discountPrice": 199.99,
  "softwareTagIds": ["guid1", "guid2"],
  "thumbnailUrl": "https://...",
  "previewVideoUrl": "https://..."
}
```
**Response (201):**
```json
{ "courseId": "guid", "message": "Course draft created successfully." }
```

---

### `PUT /api/instructor/courses/{courseId}`
Update course (partial — only provided fields change).

**Request Body:** Same fields as create, all optional.

---

### `DELETE /api/instructor/courses/{courseId}`
Archive course (soft-delete).

---

### `GET /api/instructor/courses`
Get all courses owned by the current instructor.

---

### `POST /api/instructor/courses/{courseId}/sections`
Add a section.

**Request Body:**
```json
{ "title": "Section 1: Fundamentals", "order": 1 }
```

---

### `PUT /api/instructor/courses/sections/{sectionId}`
Update section title/order.

### `DELETE /api/instructor/courses/sections/{sectionId}`
Delete section + its lessons.

---

### `POST /api/instructor/courses/sections/{sectionId}/lessons`
Add a lesson.

**Request Body:**
```json
{
  "title": "Lesson 1: Sun & Sky",
  "videoUrl": "https://vimeo.com/...",
  "durationMinutes": 25,
  "isPreview": true,
  "order": 1,
  "type": "Video",
  "contentText": null
}
```

### `PUT /api/instructor/courses/lessons/{lessonId}` — Update lesson
### `DELETE /api/instructor/courses/lessons/{lessonId}` — Delete lesson

---

### `POST /api/instructor/courses/lessons/{lessonId}/assets`
Add downloadable asset.

**Request Body:**
```json
{ "fileName": "project-files.zip", "storageKey": "s3://...", "sizeBytes": 1048576, "allowedDownload": true }
```

### `DELETE /api/instructor/courses/assets/{assetId}` — Delete asset
### `GET /api/instructor/courses/lessons/{lessonId}/assets` — List lesson assets

---

### `PUT /api/instructor/courses/{courseId}/submit`
Submit course for admin review.

**Response (200):**
```json
{ "message": "Course submitted for admin review successfully." }
```

---

### `GET /api/instructor/courses/dashboard` 🔒
Instructor analytics dashboard.

**Response (200):**
```json
{
  "totalCourses": 5,
  "publishedCourses": 3,
  "totalStudents": 150,
  "totalRevenue": 25000.00,
  "averageRating": 4.7,
  "totalReviews": 42,
  "courseStats": [
    { "courseId": "guid", "title": "...", "enrolledStudents": 50, "revenue": 10000, "averageRating": 4.8 }
  ],
  "recentReviews": [
    { "reviewId": "guid", "courseTitle": "...", "studentName": "Hazem", "rating": 5, "comment": "Great!", "createdAt": "..." }
  ]
}
```

---

## 4. Shopping Cart & Checkout 🔒

### `GET /api/cart`
Get current student's cart.

**Response (200):**
```json
{
  "items": [
    { "courseId": "guid", "courseTitle": "V-Ray Masterclass", "price": 299.99, "discountPrice": 199.99, "effectivePrice": 199.99 }
  ],
  "subTotal": 199.99,
  "discountAmount": 0,
  "total": 199.99,
  "couponCode": null
}
```

---

### `POST /api/cart/items`
Add course to cart (prices loaded server-side — **cannot be tampered**).

**Request Body:**
```json
{ "courseId": "guid" }
```
**Response (200):**
```json
{ "cartId": "guid" }
```

---

### `DELETE /api/cart/items/{courseId}`
Remove a course from cart.

---

### `POST /api/cart/coupon`
Apply coupon code.

**Request Body:**
```json
{ "couponCode": "SAVE20" }
```
**Response (200):**
```json
{ "message": "Coupon applied!", "discountAmount": 40.00 }
```

---

### `DELETE /api/cart/coupon`
Remove applied coupon.

---

## 5. Orders & Payments 🔒

### `POST /api/orders/checkout`
Create an order from the cart for manual InstaPay transfer. Transfer the displayed amount, then submit the receipt for administrator review.

**Response (200):**
```json
{
  "orderId": "guid",
  "total": 199.99,
  "message": "Order created. Transfer the amount via InstaPay, then submit your receipt for review.",
  "paymentMethod": "InstaPay",
  "instructionsUrl": "/api/orders/instapay-instructions"
}
```

---

### `GET /api/orders`
Get current student's order history.

**Response (200):**
```json
[
  {
    "id": "guid",
    "status": "Paid",
    "totalBeforeDiscount": 299.99,
    "totalAfterCoupon": 269.99,
    "couponCode": "ARCH10",
    "paidAt": "2026-10-15T...",
    "items": [
      { "courseId": "guid", "courseTitle": "...", "unitPrice": 269.99 }
    ]
  }
]
```

---

### `GET /api/orders/{id}`
Get order details by ID (own orders only).

---

### `GET /api/orders/instapay-instructions` (Public)
Get InstaPay payment details and transfer instructions for students.

**Response (200):**
```json
{
  "accountHandle": "adhamtarek1144@instapay",
  "phoneNumber": "01555707915",
  "paymentLink": "https://ipn.eg/S/adhamtarek1144/instapay/8II4oY",
  "accountName": "Adham Tarek",
  "instructions": "1. حول المبلغ المطلوب عبر تطبيق انستاباي إلى adhamtarek1144@instapay أو رقم 01555707915 أو الرابط المباشر.\n2. التقط سكرين شوت لإيصال التحويل الناجح.\n3. ارفع صورة الإيصال واكتب رقم المحفظة أو اسم الحساب المحول منه.\n4. سيتم مراجعة الطلب وتفعيل الكورسات في حسابك فوراً."
}
```

---

### `POST /api/orders/{id}/receipt` 🔒
Submit payment receipt using an image URL (Student).

**Request Body:**
```json
{
  "senderDetails": "01555707915 - Adham Tarek",
  "receiptImageUrl": "https://example.com/receipt.jpg"
}
```

**Response (200):**
```json
{
  "succeeded": true,
  "orderId": "guid",
  "message": "Receipt submitted successfully! Your payment is currently under review by the administration.",
  "errors": []
}
```

---

### `POST /api/orders/{id}/receipt/upload` 🔒 (multipart/form-data)
Submit payment receipt by uploading an image or PDF file (Student).

**Form Data:**
* `file`: (Binary image: JPG, PNG, WEBP, or PDF up to 10MB)
* `senderDetails`: "01555707915"

**Response (200):**
```json
{
  "succeeded": true,
  "orderId": "guid",
  "message": "Receipt submitted successfully! Your payment is currently under review by the administration.",
  "errors": []
}
```

---

## 5.1 Admin Manual Payments Management 🔒 (Admin Role)

### `GET /api/admin/orders/pending-verification`
List all manual payment orders waiting for admin approval.

**Response (200):**
```json
[
  {
    "orderId": "guid",
    "paymentId": "guid",
    "studentId": "guid",
    "studentEmail": "student@example.com",
    "amount": 1800.00,
    "orderStatus": "PendingVerification",
    "paymentStatus": "PendingVerification",
    "receiptImageUrl": "/uploads/receipts/xxxx.png",
    "senderDetails": "01555707915",
    "createdAt": "2026-11-14T...",
    "items": [
      { "courseId": "guid", "courseTitle": "3ds Max ArchViz", "unitPrice": 1800.00 }
    ]
  }
]
```

---

### `POST /api/admin/orders/{id}/approve-payment`
Approve a pending manual payment. Marks order as `Paid`, grants enrollments to the student, increments enrolled counts, and clears the student's cart atomically.

**Response (200):**
```json
{
  "message": "Order guid approved successfully. 1 enrollment(s) granted to student."
}
```

---

### `POST /api/admin/orders/{id}/reject-payment`
Reject a pending manual payment with a reason.

**Request Body:**
```json
{
  "reason": "صورة الإيصال غير واضحة، برجاء إعادة الإرسال."
}
```

**Response (200):**
```json
{
  "message": "Order guid rejected. Reason: صورة الإيصال غير واضحة، برجاء إعادة الإرسال."
}
```

---

## 6. Enrollments & Student Dashboard 🔒

### `GET /api/enrollments`
Get all enrolled courses for current student.

---

### `GET /api/enrollments/{courseId}/check`
Check if enrolled in a specific course.

**Response (200):**
```json
{ "isEnrolled": true }
```

---

### `GET /api/enrollments/dashboard`
Student learning dashboard.

**Response (200):**
```json
{
  "enrolledCourses": [
    { "courseId": "guid", "courseTitle": "...", "progressPercentage": 45.0, "enrolledAt": "..." }
  ],
  "certificates": [
    { "id": "guid", "courseTitle": "...", "verificationCode": "CERT-XXXX", "issuedAt": "..." }
  ],
  "recentActivity": [
    { "type": "LessonCompleted", "courseTitle": "...", "lessonTitle": "...", "timestamp": "..." }
  ]
}
```

---

## 7. Learning & Progress 🔒

### `POST /api/progress`
Record lesson watching heartbeat / completion.

**Request Body:**
```json
{
  "courseId": "guid",
  "lessonId": "guid",
  "watchedSeconds": 180,
  "markAsCompleted": false
}
```
**Response (200):**
```json
{ "lessonId": "guid", "isCompleted": false, "watchedSeconds": 180, "courseProgressPercentage": 25.0 }
```

---

### `GET /api/progress/{courseId}`
Get overall course progress for student.

**Response (200):**
```json
{
  "courseId": "guid",
  "completedLessons": 5,
  "totalLessons": 20,
  "progressPercentage": 25.0,
  "allQuizzesPassed": false
}
```

---

### `GET /api/progress/{courseId}/lessons/{lessonId}/play`
Get secure video playback URL for an enrolled lesson.

**Response (200):**
```json
{ "playbackUrl": "https://signed-url...", "expiresAt": "..." }
```

---

### `POST /api/progress/download-token`
Generate single-use download token for lesson asset.

**Request Body:**
```json
{ "courseId": "guid", "lessonId": "guid", "assetId": "guid" }
```
**Response (200):**
```json
{ "tokenId": "guid", "downloadUrl": "/api/progress/download/{tokenId}", "expiresAt": "..." }
```

---

### `GET /api/progress/download/{tokenId}`
Download asset (redirects to signed URL). No auth needed — secured by single-use token.

---

### `POST /api/progress/{courseId}/certificate`
Issue course completion certificate (requires 100% lessons + all quizzes passed).

**Response (200):**
```json
{
  "certificateId": "guid",
  "verificationCode": "CERT-ABC123",
  "courseTitle": "...",
  "studentName": "Ahmed",
  "issuedAt": "2026-10-15T..."
}
```

---

### `GET /api/certificates/{code}/verify`
Public certificate verification (no auth).

**Response (200):**
```json
{
  "isValid": true,
  "courseTitle": "V-Ray Masterclass",
  "studentName": "Ahmed Mohamed",
  "issuedAt": "2026-10-15T...",
  "verificationCode": "CERT-ABC123"
}
```

---

### `GET /api/certificates/{code}/pdf` (Public)
Download the certificate as an official, high-resolution PDF document generated server-side using QuestPDF.

**Response (200):**
* Content-Type: `application/pdf`
* Content-Disposition: `attachment; filename="Certificate_CERT-ABC123.pdf"`

---

## 7.1 Media & File Uploads 🔒

### `POST /api/uploads/image` (Authorized)
Upload an image (avatar, course thumbnail, marketing banner). Max 5MB.
* Supported: `JPG`, `JPEG`, `PNG`, `WEBP`, `GIF`.

**Form Data:**
* `file`: Binary image file.

**Response (200):**
```json
{
  "url": "/uploads/images/a1b2c3d4.png",
  "fileName": "thumbnail.png",
  "sizeBytes": 245100
}
```

---

### `POST /api/uploads/asset` (Instructor, Admin)
Upload course project files, assets, textures, or 3D models. Max 200MB.
* Supported: `ZIP`, `RAR`, `7Z`, `PDF`, `BLEND`, `MAX`, `FBX`, `OBJ`, `C4D`, `PSD`, `MP4`.

**Form Data:**
* `file`: Binary asset file.

**Response (200):**
```json
{
  "url": "/uploads/assets/e5f6g7h8.zip",
  "storageKey": "e5f6g7h8.zip",
  "fileName": "archviz-assets.zip",
  "sizeBytes": 52428800
}
```

---

## 8. Quizzes 🔒

### `GET /api/quizzes/course/{courseId}`
List all quizzes for a course.

**Response (200):**
```json
[
  { "id": "guid", "title": "V-Ray Lighting Quiz", "description": "...", "passingScore": 70, "maxAttempts": 3, "questionCount": 10 }
]
```

---

### `GET /api/quizzes/{quizId}`
Get quiz questions (correct answers **hidden**). Enrollment required.

**Response (200):**
```json
{
  "id": "guid",
  "title": "V-Ray Lighting Quiz",
  "questions": [
    { "id": "guid", "text": "What is V-Ray Sun?", "options": ["Light source", "Texture", "Camera"] }
  ]
}
```

---

### `POST /api/quizzes/{quizId}/submit`
Submit quiz answers for server-side grading.

**Request Body:**
```json
{
  "answers": {
    "question-guid-1": 0,
    "question-guid-2": 2
  }
}
```
**Response (200):**
```json
{
  "scorePercentage": 80,
  "passed": true,
  "correctAnswersCount": 8,
  "totalQuestions": 10
}
```

---

### `GET /api/quizzes/course/{courseId}/attempts`
Get student's quiz attempt history for a course.

---

### `POST /api/quizzes` 🔒 `Instructor,Admin`
Create a quiz for a course.

**Request Body:**
```json
{
  "courseId": "guid",
  "title": "V-Ray Lighting Quiz",
  "description": "Test your knowledge",
  "passingScorePercentage": 70,
  "maxAttempts": 3,
  "questions": [
    { "text": "What is V-Ray Sun?", "options": ["Light source", "Texture", "Camera"], "correctOptionIndex": 0 }
  ]
}
```

---

## 9. Reviews 🔒

### `POST /api/courses/{courseId}/reviews`
Post a review (requires enrollment, one per student, defaults to **Pending** moderation).

**Request Body:**
```json
{ "rating": 5, "comment": "Amazing course for archviz!" }
```
**Response (200):**
```json
{ "reviewId": "guid", "message": "Review posted successfully." }
```

---

## 10. Community Q&A Discussions

### `POST /api/community/posts` 🔒
Create a discussion post.

**Request Body:**
```json
{ "courseId": "guid", "lessonId": "guid-or-null", "title": "How to setup V-Ray Sun?", "content": "I'm stuck on..." }
```

---

### `GET /api/community/courses/{courseId}/posts`
Get discussion posts for a course (optional `?lessonId=` filter). **Public.**

---

### `POST /api/community/posts/{postId}/replies` 🔒
Reply to a discussion post.

**Request Body:**
```json
{ "content": "You need to adjust the multiplier..." }
```

---

## 11. CMS Home Page & Newsletter

### `GET /api/cms/home`
Get dynamic home page content. **Public.**

**Response (200):**
```json
{
  "hero": {
    "mainTitle": "Master 3D & Architectural Visualization",
    "subtitle": "Learn 3ds Max, V-Ray, Corona...",
    "primaryCtaText": "Explore Courses",
    "primaryCtaLink": "/courses",
    "backgroundUrl": null
  },
  "announcement": null,
  "featuredCategories": [...],
  "featuredCourses": [...],
  "statistics": { "totalStudents": 500, "totalCourses": 25, "totalEnrollments": 1200, "totalInstructors": 8 }
}
```

---

### `POST /api/cms/newsletter/subscribe`
Subscribe to newsletter (persisted, duplicate-safe). **Public.**

**Request Body:**
```json
{ "email": "student@example.com" }
```
**Response (200):**
```json
{ "email": "student@example.com", "succeeded": true, "message": "Thank you for subscribing!" }
```

---

## 12. Admin Panel 🔒 `Admin`

### `GET /api/admin/statistics`
Global dashboard analytics.

**Response (200):**
```json
{
  "totalRevenue": 50000.00,
  "totalPaidOrders": 200,
  "totalRegisteredUsers": 500,
  "totalPublishedCourses": 25,
  "totalPendingCourses": 3,
  "totalActiveEnrollments": 1200,
  "topSellingCourses": [
    { "courseId": "guid", "courseTitle": "...", "salesCount": 50, "totalRevenue": 10000 }
  ]
}
```

---

### `GET /api/admin/courses/pending`
List courses awaiting approval.

### `PUT /api/admin/courses/{id}/approve`
Approve or reject a course.

**Request Body:**
```json
{ "approve": true, "rejectionReason": null }
```

### `DELETE /api/admin/courses/{id}`
Admin archive a course.

---

### `GET /api/admin/reviews/pending`
Get reviews pending moderation.

### `PUT /api/admin/reviews/{id}/moderate`
Approve or reject a review.

**Request Body:**
```json
{ "status": "Approved" }
```
Values: `Approved`, `Rejected`, `Pending`

---

### `GET /api/admin/users`
List users with search/filter.

**Query Params:** `search`, `role`, `page`, `pageSize`

**Response (200):**
```json
{
  "users": [
    { "id": "guid", "fullName": "Ahmed", "email": "...", "roles": ["Student"], "createdAt": "...", "isActive": true }
  ],
  "totalCount": 500,
  "page": 1,
  "pageSize": 20
}
```

---

### `PUT /api/admin/users/{id}/roles`
Update user roles.

**Request Body:**
```json
{ "roles": ["Student", "Instructor"] }
```

### `PUT /api/admin/users/{id}/lock`
Lock or unlock a user account.

**Request Body:**
```json
{ "lock": true }
```

---

### `PUT /api/admin/cms/home`
Update home page content.

**Request Body:**
```json
{
  "heroTitle": "New Title",
  "heroSubtitle": "New subtitle",
  "heroCtaText": "Start Learning",
  "heroCtaLink": "/courses",
  "announcementText": "50% off this week!",
  "showAnnouncement": true,
  "testimonialsJson": "[{\"name\":\"Ahmed\",\"text\":\"Great platform!\"}]"
}
```

---

## 13. Admin Payments — Coupons & Enrollments 🔒 `Admin`

### `GET /api/admin/coupons`
List all coupons.

### `POST /api/admin/coupons`
Create coupon.

**Request Body:**
```json
{
  "code": "SUMMER30",
  "discountType": "Percentage",
  "value": 30,
  "expiryDate": "2026-12-31T00:00:00Z",
  "maxUses": 100
}
```
`discountType`: `Percentage` or `Fixed`

### `PATCH /api/admin/coupons/{id}/toggle`
Enable/disable coupon: `{ "isActive": false }`

### `DELETE /api/admin/coupons/{id}`
Delete coupon.

---

### `GET /api/admin/enrollments/student/{studentId}`
Get enrollments for a student.

### `POST /api/admin/enrollments`
Admin-grant enrollment.

**Request Body:**
```json
{ "studentId": "guid", "courseId": "guid", "courseTitle": "...", "courseSlug": "...", "expiresAt": null }
```

### `DELETE /api/admin/enrollments/student/{studentId}/course/{courseId}`
Revoke enrollment.

---

### `GET /api/admin/orders`
List all orders (filter by `status`, `from`, `to`).

### `POST /api/admin/orders/{id}/refund`
Record a manual InstaPay refund and revoke the enrollments. The administrator must send the money through InstaPay separately.

**Request Body:**
```json
{ "reason": "Customer requested refund" }
```

---

## 14. Payment verification

Online payment webhooks are disabled. Payments are completed only through InstaPay manual transfer: the student uploads a receipt and an administrator approves or rejects it. The platform emails all administrators after a receipt is submitted, and emails the student after approval or rejection.

---

## Error Responses

All errors follow a consistent format:

**400 Bad Request:**
```json
{ "errors": ["Validation error message"] }
```

**401 Unauthorized:**
```json
{ "errors": ["Invalid credentials"] }
```

**403 Forbidden:** Role mismatch (e.g., Student accessing Admin endpoints).

**404 Not Found:**
```json
{ "message": "Resource not found." }
```

**429 Too Many Requests:** Rate limited (OTP endpoint).

**500 Internal Server Error:**
```json
{ "error": "An unexpected error occurred.", "traceId": "correlation-id" }
```

---

## Security Notes

| Feature | Implementation |
|---------|---------------|
| **Server-side pricing** | Cart & checkout NEVER trust client-sent prices — always loaded from Catalog DB |
| **JWT secrets** | Not in source control. Loaded from environment variables / user-secrets |
| **Payment verification** | Admin reviews the private InstaPay receipt before activating enrollment |
| **Review integrity** | Enrollment required + one per student + default Pending moderation |
| **Password hashing** | ASP.NET Identity (bcrypt/PBKDF2) |
| **Refresh token rotation** | Old token revoked on each refresh |
| **Rate limiting** | OTP endpoint: 3 requests/minute |

---

> **Generated:** October 2026 | **Version:** 1.0 | **Tests:** 46/46 ✅
