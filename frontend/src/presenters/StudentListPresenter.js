export class StudentListPresenter {
    constructor(studentService, view) {
      this.studentService = studentService;
      this.view = view;
    }
  
    async loadStudents() {
      try {
        this.view.setLoading(true);
        const students = await this.studentService.getAllStudents();
        this.view.setStudents(students);
      } catch (error) {
        this.view.setError('Failed to load students');
      } finally {
        this.view.setLoading(false);
      }
    }
  
    async deleteStudent(student) {
      try {
        if (student.balance > 0) {
          this.view.setError('Cannot delete student with outstanding balance');
          return;
        }
  
        await this.studentService.deleteStudent(student.id);
        await this.loadStudents();
      } catch (error) {
        this.view.setError('Failed to delete student');
      }
    }
  
    async updateStudentStatus(studentId, newStatus) {
      try {
        await this.studentService.updateStudent(studentId, {
          enrollmentStatus: newStatus
        });
        await this.loadStudents();
      } catch (error) {
        this.view.setError('Failed to update student status');
      }
    }
  }