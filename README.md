Dkale Attendance & Fees System
A student management system that tracks attendance, fees, and payments for the Dkale dance program. The system supports role-based access control (RBAC), automatic fee calculations, and real-time reporting to ensure accurate tracking of student participation and payments.

📖 Features Overview
✅ User Authentication & Roles
Uses Firebase Authentication for secure login.
Role-Based Access Control (RBAC) ensures different permissions.
Anonymous users can view public attendance reports.
Role	Permissions
Super Admin	Manage admins, students, attendance, fees, payments, and system settings.
Admin	Manage students, attendance, fees, and payments.
Student	View personal attendance and fee balance.
Anonymous	View public attendance summaries.
2️⃣ Student Management
✅ Core Features
Admins can add, update, or remove students.
Students can join at different times, meaning past classes should not count as absences.
A student cannot be removed if they still owe money.
If a student stops attending but has an outstanding balance, they are marked as "Pending Payment".
Once a pending payment student clears their balance, an admin can remove them.
✅ Student Statuses
Status	Description
Enrolled	Actively attending classes
Inactive	Temporarily not attending but still part of the system
Pending Payment	No longer attending but still owes money
Removed	Can only be removed when balance = $0
3️⃣ Attendance Tracking
✅ How Attendance Works
Attendance is recorded for Mondays, Wednesdays, and Fridays.
The system automatically generates a monthly attendance sheet and updates it in real time.
If an admin marks attendance for a given day, the monthly report updates automatically.
✅ Attendance Statuses
Status	Meaning	Fee Applied?
Present	Attended class	No fee
Late	Arrived late	$1
No Shoes	Attended without proper shoes	$1
Not in Uniform	Attended but not in uniform	$1
Absent	Unexcused absence	$5
Medical Absence	Absent with valid medical reason	No fee
Holiday	No class (public holiday)	No fee
Not Enrolled	Student had not joined yet	No fee
✅ Admin Capabilities
Mark attendance, late status, no-shoes fee, and not-in-uniform fee for a student.
Mark medical absences to prevent charging the absence fee.
Set public holidays so that no fees are charged.
4️⃣ Fees & Penalties
✅ Fee Rules
Mandatory Fees: Fees for lateness, no shoes, not in uniform, or unexcused absences must always be applied.
Multiple Fees: A student can have multiple penalties per session (e.g., late + no shoes + not in uniform).
Refunds: Only admins can apply refunds (for mistakes).
✅ Types of Fees
Type	Condition	Fee Amount
Late Fee	Marked as late	$1
No Shoes Fee	Attended without proper shoes	$1
Not in Uniform Fee	Attended without proper uniform	$1
Absence Fee	Unexcused absence	$5
Medical Absence	Excused absence (medical reason)	No fee
Refund	Admin manually applies correction	Varies
5️⃣ Payments & Balances
✅ How Payments Work
Payments can be made at any time.
Student balances update automatically when payments are added.
Payment history is stored for tracking.
✅ Admin Capabilities
Add payments to a student’s balance.
View payment history per student.
Modify incorrect payment entries (admins only).
✅ Student Capabilities
View payment history and outstanding balance.
✅ Reports & Summaries
Type	Data Provided
Per Student Report	Total fees charged, total paid, outstanding balance.
Monthly Summary	Sum of all payments received and total outstanding fees per month.
Cumulative Report	Overall total of all payments and outstanding balances across all months.
6️⃣ Reports & Notifications
✅ Real-Time Monthly Report Updates
Every attendance update automatically updates the monthly report.
If an admin marks a student absent, late, or with a uniform violation, the system recalculates the monthly total in real-time.
✅ Notifications
End-of-Month Notification: Students with overdue balances should be notified at the end of the month.
(Future feature): Payment reminders can be added later.
✅ Admin Dashboard
View total collected payments vs. outstanding fees.
Get a monthly & cumulative breakdown of payments and balances.
✅ Student Dashboard
See detailed fees and charges per date.
View payment history.
📂 API Endpoints
User Authentication & Management
Method	Endpoint	Description	Access
POST	/api/auth/login	User login (Firebase Auth)	All users
GET	/api/users	Get all users	Admin
PATCH	/api/users/{id}	Update user role	Admin
Student Management
Method	Endpoint	Description	Access
POST	/api/students	Add a new student	Admin
GET	/api/students	Get all active students	Admin, Public
GET	/api/students?status=pending_payment	Get students with outstanding balance	Admin
PATCH	/api/students/{id}	Update student status (e.g., "Inactive", "Pending Payment")	Admin
DELETE	/api/students/{id}	Remove student ONLY if balance = $0	Admin
Attendance Management
Method	Endpoint	Description	Access
POST	/api/attendance/{month}/{day}	Mark attendance	Admin
PATCH	/api/attendance/{month}/{day}/{studentId}	Update attendance (late, no shoes, not in uniform, absent)	Admin
Fees & Payments
Method	Endpoint	Description	Access
GET	/api/fees/{studentId}	Get fees for a student	Admin, Student
POST	/api/payments/{studentId}	Add payment	Admin
GET	/api/payments/{studentId}	Get payment history	Admin, Student
GET	/api/reports/monthly/{month}	Monthly financial & attendance report	Admin
GET	/api/reports/cumulative	Overall cumulative report	Admin
🌟 Future Enhancements
Add payment reminders for students.
Integrate automatic online payments (Stripe, PayPal).
Provide export options for financial reports (CSV, PDF).
📌 Next Steps
Database Design: Define Firebase Firestore structure.
API Development: Implement Firebase Cloud Functions for endpoints.
Testing & Deployment: Ensure real-time updates work correctly.
