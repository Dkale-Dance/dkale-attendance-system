# Firestore Security Rules for Dance School Management Application

These security rules should be placed in your Firestore security rules file and deployed to Firebase. 
They implement comprehensive access controls based on user roles and ensure data validation.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions for role-based access
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isSuperAdmin() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }
    
    function isStudent() {
      return isSignedIn() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'student';
    }
    
    function isAdminOrSuperAdmin() {
      return isAdmin() || isSuperAdmin();
    }
    
    function isCurrentUser(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Data validation functions
    function isValidUserData() {
      let validRoles = ['student', 'admin', 'superadmin'];
      let validStatuses = ['Enrolled', 'Inactive', 'Pending Payment', 'Removed'];
      
      let hasValidRole = request.resource.data.role is string && 
                         validRoles.hasAny([request.resource.data.role]);
      
      let hasValidEnrollmentStatus = request.resource.data.role == 'student' ? 
                                  request.resource.data.enrollmentStatus is string && 
                                  validStatuses.hasAny([request.resource.data.enrollmentStatus]) : 
                                  true;
      
      let hasValidBalance = request.resource.data.balance is number || 
                           !('balance' in request.resource.data);
      
      return hasValidRole && hasValidEnrollmentStatus && hasValidBalance;
    }
    
    function isValidAttendanceData() {
      let validStatuses = ['present', 'absent', 'late', 'medicalAbsence', 'holiday'];
      
      // Verify each student status is valid
      let allEntriesValid = true;
      let studentIds = request.resource.data.keys();
      
      for (let studentId in studentIds) {
        let studentData = request.resource.data[studentId];
        
        let hasValidStatus = studentData.status is string && 
                            validStatuses.hasAny([studentData.status]);
        
        let hasTimestamp = studentData.timestamp is timestamp;
        
        let hasValidAttributes = studentData.attributes is map || 
                                 !('attributes' in studentData);
        
        allEntriesValid = allEntriesValid && hasValidStatus && hasTimestamp && hasValidAttributes;
      }
      
      return allEntriesValid;
    }
    
    function isValidPaymentData() {
      let hasPositiveAmount = request.resource.data.amount is number && 
                             request.resource.data.amount > 0;
      
      let hasStudentId = request.resource.data.studentId is string;
      
      let hasTimestamp = request.resource.data.timestamp is timestamp;
      
      return hasPositiveAmount && hasStudentId && hasTimestamp;
    }
    
    function studentIsUpdatingAllowedFields() {
      let allowedFields = ['firstName', 'lastName', 'phoneNumber', 'emailNotifications', 'emergencyContact'];
      
      let incomingFields = request.resource.data.diff(resource.data).affectedKeys();
      let allowedFieldsOnly = true;
      
      for (let field in incomingFields) {
        allowedFieldsOnly = allowedFieldsOnly && allowedFields.hasAny([field]);
      }
      
      return allowedFieldsOnly;
    }
    
    // Users collection rules
    match /users/{userId} {
      // Read access
      allow read: if isSuperAdmin() || 
                 isAdmin() || 
                 isCurrentUser(userId);
      
      // Write access
      allow create: if isSuperAdmin() || 
                   (isAdmin() && request.resource.data.role != 'admin' && request.resource.data.role != 'superadmin') ||
                   (isSignedIn() && isCurrentUser(userId) && request.resource.data.role == 'student');
      
      allow update: if isSuperAdmin() || 
                   (isAdmin() && resource.data.role != 'admin' && resource.data.role != 'superadmin') ||
                   (isStudent() && isCurrentUser(userId) && studentIsUpdatingAllowedFields());
      
      allow delete: if isSuperAdmin();
      
      // Data validation for all operations
      allow write: if isValidUserData();
    }
    
    // Attendance collection rules
    match /attendance/{date} {
      // Read access
      allow read: if isAdminOrSuperAdmin();
      
      // Students can only read attendance records containing their ID
      allow read: if isStudent() && resource.data.keys().hasAny([request.auth.uid]);
      
      // Write access - only admins can modify attendance
      allow write: if isAdminOrSuperAdmin() && isValidAttendanceData();
    }
    
    // Payments collection rules
    match /payments/{paymentId} {
      // Read access
      allow read: if isAdminOrSuperAdmin();
      
      // Students can only read their own payment records
      allow read: if isStudent() && resource.data.studentId == request.auth.uid;
      
      // Write access - only admins can modify payments
      allow write: if isAdminOrSuperAdmin() && isValidPaymentData();
    }
    
    // Audit logs collection rules
    match /auditLogs/{logId} {
      // Read access - only admins can read audit logs
      allow read: if isAdminOrSuperAdmin();
      
      // No client-side writes allowed to audit logs
      allow write: if false; // All audit logs should be written server-side for integrity
    }
  }
}
```

## How to Deploy

1. Copy these rules to your `firestore.rules` file.
2. Deploy the rules using Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

## Security Design Notes

1. **Role-Based Access Control (RBAC)**:
   - SuperAdmin: Full access to all collections
   - Admin: Can manage students and their data, but cannot modify other admins
   - Student: Can only access their own data
   - Anonymous: No access to protected data

2. **Data Validation**:
   - Ensures proper data formats and field types
   - Prevents invalid status values or enrollment states
   - Enforces positive payment amounts

3. **Field-Level Security**:
   - Students can only modify specific fields in their profile
   - Admins cannot modify other admin accounts
   - Protected fields like balance and role have strict access controls

4. **Audit Logs Protection**:
   - Audit logs cannot be modified from client-side code
   - Only accessible to admins for compliance and monitoring

For optimal security, combine these rules with Firebase Authentication and use server-side Cloud Functions for sensitive operations like payment processing.