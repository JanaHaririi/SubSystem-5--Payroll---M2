# Employee Profile Subsystem - Backend Documentation

## Overview

This is the backend implementation for the **Employee Profile Subsystem** using NestJS, MongoDB, and TypeScript. The system provides comprehensive employee profile management with three main user roles:

1. **Employee Self-Service** - View and update own profile
2. **Department Manager** - View team member profiles
3. **HR Admin/System Admin** - Master data management and approvals

## Features Implemented

### 1. Employee Self-Service (US-E2-04, US-E2-05, US-E2-12, US-E6-02, US-E2-06)

✅ **View Full Profile** - Employees can view their complete profile including:
- Personal information (name, DOB, gender, marital status)
- Contact details (email, phone, address)
- Employment details (employee number, hire date, position, department)
- Contract information (type, dates, work type)
- Appraisal history from Performance Module

✅ **Update Contact Information** - Immediate updates without approval:
- Mobile phone, home phone
- Personal email
- Address (city, street, country)

✅ **Update Profile** - Immediate updates:
- Biography/short bio
- Profile picture upload

✅ **Request Critical Data Changes** - Submit change requests for:
- Job title, department changes
- Legal name changes
- Marital status updates
- Any other HR-governed fields

### 2. Department Manager View (US-E4-01, US-E4-02)

✅ **View Team Members** - Access team list with:
- Employee number, name
- Position and department
- Date of hire, current status
- Profile picture
- **Privacy:** Excludes sensitive data (salary, national ID, etc.)

✅ **View Team Member Details** - Detailed profile of direct reports
- Restricted to direct reports only (BR 41b)
- Non-sensitive data view (BR 18b)

### 3. HR Admin/System Admin (US-EP-04, US-EP-05, US-E6-03, US-E2-03)

✅ **Search Employees** - Search and filter by:
- Name, employee number, email
- Status (Active, On Leave, Suspended, etc.)
- Department

✅ **Master Data Management** - Full CRUD access to:
- All profile fields (personal, employment, contract)
- Position, department assignments
- Pay grade assignments
- System roles and permissions

✅ **Status Management** - Change employee status:
- Deactivate upon termination/resignation
- Change status (Active, On Leave, Suspended, Retired, etc.)
- Set effective dates

✅ **Approve/Reject Change Requests** - Workflow approval:
- Review pending change requests
- Approve or reject with remarks
- Automatic notifications to employees

## Technical Architecture

### Database Schemas

#### EmployeeProfile
- Extends `UserProfileBase` (personal info, contact)
- Employment details (hire date, employee number, status)
- Contract information (type, dates, work type)
- Organizational links (position, department, supervisor, pay grade)
- Appraisal summary (last appraisal date, score, rating)

#### EmployeeProfileChangeRequest
- Request tracking (requestId, description, reason)
- Status workflow (PENDING, APPROVED, REJECTED, CANCELED)
- Timestamps (submitted, processed)

#### AuditTrail
- Complete audit logging (BR 22)
- Action tracking (CREATE, UPDATE, DELETE, APPROVE, REJECT)
- Old/new values
- User information (who, when, why)

### Services

#### EmployeeProfileService
Core business logic for all profile operations:
- Profile retrieval and updates
- Change request workflow
- Team management for managers
- Search and filtering
- Status management

#### AuditTrailService
Comprehensive audit logging (BR 22):
- Tracks all profile modifications
- Records who made changes and when
- Stores before/after values
- Maintains complete history

#### NotificationService
Integration points for notifications:
- N-037: Profile updated
- N-040: Change request submitted
- N-041: Change request processed
- Extensible for email, SMS, in-app notifications

#### FileUploadService
Profile picture management:
- File validation (size, type)
- Secure file storage
- Old file cleanup
- Image serving

### API Endpoints

#### Employee Self-Service
```
GET    /employee-profile/me                      - View my profile
PATCH  /employee-profile/me/contact-info         - Update contact info
PATCH  /employee-profile/me/profile              - Update bio/picture
POST   /employee-profile/me/change-requests      - Submit change request
GET    /employee-profile/me/change-requests      - View my requests
```

#### Department Manager
```
GET    /employee-profile/team                    - View team members
GET    /employee-profile/team/:employeeId        - View team member details
```

#### HR Admin
```
GET    /employee-profile/search                  - Search employees
GET    /employee-profile/:employeeId             - Get employee by ID
PUT    /employee-profile/:employeeId             - Update master data
PATCH  /employee-profile/:employeeId/status      - Change status
```

#### Change Requests
```
GET    /employee-profile/change-requests/pending        - Pending requests
GET    /employee-profile/change-requests/:requestId     - Get request details
PATCH  /employee-profile/change-requests/:requestId/process - Approve/Reject
```

#### File Upload
```
POST   /employee-profile/upload/profile-picture         - Upload picture
GET    /employee-profile/upload/profile-picture/:filename - Get picture
```

## Security & Authorization

### Role-Based Access Control (RBAC)
- `AuthGuard` - Validates authentication
- `RolesGuard` - Enforces role-based permissions
- `@Roles()` decorator - Specifies required roles
- `@CurrentUser()` decorator - Extracts current user

### System Roles
```typescript
enum SystemRole {
  DEPARTMENT_EMPLOYEE = 'department employee',
  DEPARTMENT_HEAD = 'department head',
  HR_MANAGER = 'HR Manager',
  HR_EMPLOYEE = 'HR Employee',
  HR_ADMIN = 'HR Admin',
  SYSTEM_ADMIN = 'System Admin',
  // ... other roles
}
```

### Business Rules Implemented

- **BR 2a-r**: All required personal and job data fields
- **BR 3d, 3e**: Department/Supervisor links
- **BR 3j**: Employee status controls system access
- **BR 10c**: Pay Grade/Band definitions
- **BR 16**: Appraisal records on profile
- **BR 17, 20**: Auto-sync with Payroll/Time Management on status change
- **BR 18b**: Privacy restrictions for managers
- **BR 20a**: Only authorized roles modify data
- **BR 22**: Complete audit trail with timestamps
- **BR 36**: Change approval workflow
- **BR 41b**: Managers see only direct reports

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Environment Variables
Create a `.env` file:
```
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
PORT=3000
```

### Installation
```bash
cd hr-employee-subsystem
npm install
```

### Running the Application
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Access Swagger Documentation
```
http://localhost:3000/api/docs
```

## API Testing

### Authentication Headers
For testing, include these headers in your requests:
```
Authorization: Bearer <token>
x-user-id: <user-id>
x-employee-id: <employee-id>
x-user-role: <role>
x-employee-number: <emp-number>
```

### Example: View My Profile
```bash
curl -X GET http://localhost:3000/employee-profile/me \
  -H "Authorization: Bearer token" \
  -H "x-employee-id: 6475abc123def456789"
```

### Example: Update Contact Info
```bash
curl -X PATCH http://localhost:3000/employee-profile/me/contact-info \
  -H "Authorization: Bearer token" \
  -H "x-employee-id: 6475abc123def456789" \
  -H "Content-Type: application/json" \
  -d '{
    "mobilePhone": "+201234567890",
    "personalEmail": "john.doe@example.com",
    "address": {
      "city": "Cairo",
      "streetAddress": "123 Main St",
      "country": "Egypt"
    }
  }'
```

### Example: Submit Change Request
```bash
curl -X POST http://localhost:3000/employee-profile/me/change-requests \
  -H "Authorization: Bearer token" \
  -H "x-employee-id: 6475abc123def456789" \
  -H "Content-Type: application/json" \
  -d '{
    "requestDescription": "Request to update job title from Junior to Senior Developer",
    "reason": "Promotion effective January 2025"
  }'
```

### Example: Upload Profile Picture
```bash
curl -X POST http://localhost:3000/employee-profile/upload/profile-picture \
  -H "Authorization: Bearer token" \
  -H "x-employee-id: 6475abc123def456789" \
  -F "file=@/path/to/picture.jpg"
```

## Integration Points

### Inputs from Other Subsystems

1. **Performance Module**
   - Appraisal history (date, type, score, rating)
   - Development plans

2. **Organizational Structure**
   - Position assignments
   - Department assignments
   - Reporting hierarchy

3. **Onboarding Module**
   - Initial profile creation on contract signing
   - Basic employee data (name, ID, DOB, hire date)

4. **Leaves/Offboarding Module**
   - Status updates (On Leave, Resigned, Terminated)

### Outputs to Other Subsystems

1. **Payroll & Benefits Module**
   - Pay grade changes
   - Contract type updates
   - Status changes (for payment blocking)

2. **Time Management Module**
   - Status updates (Active, Suspended, On Leave)
   - Work schedule changes

3. **Organizational Structure**
   - Position/Department change requests
   - Hierarchy updates

## Notifications

### N-037: Profile Updated
Sent when:
- Employee updates contact info
- HR Admin modifies profile
- Change request is approved

### N-040: Profile Change Request Submitted
Sent when:
- Employee submits change request
- Notification to employee (confirmation)
- Notification to HR Manager (pending approval)

### Change Request Processed
Sent when:
- HR Admin approves or rejects request
- Includes status and remarks

## File Structure

```
src/
├── employee-profile/
│   ├── controllers/
│   │   ├── employee-profile.controller.ts
│   │   └── upload.controller.ts
│   ├── services/
│   │   ├── employee-profile.service.ts
│   │   ├── audit-trail.service.ts
│   │   ├── notification.service.ts
│   │   └── file-upload.service.ts
│   ├── models/
│   │   ├── employee-profile.schema.ts
│   │   ├── ep-change-request.schema.ts
│   │   ├── audit-trail.schema.ts
│   │   └── user-schema.ts
│   ├── dto/
│   │   ├── update-contact-info.dto.ts
│   │   ├── update-profile.dto.ts
│   │   ├── create-change-request.dto.ts
│   │   ├── process-change-request.dto.ts
│   │   └── update-employee-master.dto.ts
│   ├── enums/
│   │   └── employee-profile.enums.ts
│   └── employee-profile.module.ts
├── common/
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── roles.guard.ts
│   └── decorators/
│       ├── roles.decorator.ts
│       └── current-user.decorator.ts
└── app.module.ts
```

## Future Enhancements

1. **Authentication Integration**
   - JWT token validation
   - OAuth2/SSO support
   - Password management

2. **Email Integration**
   - SendGrid/AWS SES integration
   - Email templates
   - Bulk notifications

3. **Document Management**
   - Upload additional documents
   - Document versioning
   - Secure document storage

4. **Advanced Search**
   - ElasticSearch integration
   - Full-text search
   - Advanced filters

5. **Reporting**
   - Employee reports
   - Change request analytics
   - Audit reports

## Support

For questions or issues, please contact the development team or refer to the main project documentation.

---

**Version:** 1.0.0
**Last Updated:** November 2025
**Technology Stack:** NestJS, MongoDB, TypeScript, Swagger
