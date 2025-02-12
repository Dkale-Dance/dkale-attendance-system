class StudentService {
    constructor(studentRepository, userRepository) {
      this.studentRepository = studentRepository;
      this.userRepository = userRepository;
    }
  
    async createStudent(studentData) {
      // Check if user already has a student profile
      const existingStudent = await this.studentRepository.findByUserId(studentData.userId);
      if (existingStudent) {
        throw new Error('User already has a student profile');
      }
  
      // Create student record
      const student = await this.studentRepository.create(studentData);
  
      // Update user role
      await this.userRepository.updateUserRole(studentData.userId, 'student');
  
      return student;
    }
  
    async updateStudent(id, updateData) {
      const student = await this.studentRepository.findById(id);
      if (!student) {
        throw new Error('Student not found');
      }
  
      return this.studentRepository.update(id, updateData);
    }
  
    async deleteStudent(id) {
      const student = await this.studentRepository.findById(id);
      if (!student) {
        throw new Error('Student not found');
      }
  
      if (student.balance > 0) {
        throw new Error('Cannot delete student with outstanding balance');
      }
  
      await this.studentRepository.delete(id);
    }
  
    async getStudent(id) {
      const student = await this.studentRepository.findById(id);
      if (!student) {
        throw new Error('Student not found');
      }
      return student;
    }
  
    async getStudentByUserId(userId) {
      return this.studentRepository.findByUserId(userId);
    }
  
    async getAllStudents() {
      return this.studentRepository.findAll();
    }
  
    async getStudentsByEnrollmentStatus(status) {
      const allStudents = await this.studentRepository.findAll();
      return allStudents.filter(student => student.enrollmentStatus === status);
    }
  
    async updateEnrollmentStatus(id, status) {
      return this.updateStudent(id, { enrollmentStatus: status });
    }
  }
  
  export { StudentService };