// StudentService.js - FIXED version
import { studentRepository } from "../repository/StudentRepository";
import { sortStudentsByFirstName } from "../utils/sorting";

export default class StudentService {
  constructor(studentRepository) {
    this.studentRepository = studentRepository;
  }

  async getStudentById(studentId) {
    return this.studentRepository.getStudentById(studentId);
  }

  async updateStudent(studentId, updateData) {
    return this.studentRepository.updateStudent(studentId, updateData);
  }

  async initializeStudentProfile(userId, initialData = {}) {
    try {
      // Set initial student data when a user with role "student" is created
      const studentData = {
        enrollmentStatus: "Pending Payment",
        balance: 0,
        role: "student", // Always ensure role is explicitly set
        ...initialData
      };

      // Use the repository's setStudentData method instead of updateStudent
      // This ensures the document is created even if it doesn't exist
      return this.studentRepository.setStudentData(userId, studentData);
    } catch (error) {
      console.error("Error initializing student profile:", error);
      throw new Error(`Failed to initialize student profile: ${error.message}`);
    }
  }

  async changeEnrollmentStatus(studentId, newStatus) {
    // Validate status
    const validStatuses = ["Enrolled", "Inactive", "Pending Payment", "Removed"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(", ")}`);
    }

    // Update student status
    return this.studentRepository.updateStudent(studentId, { enrollmentStatus: newStatus });
  }

  async removeStudent(studentId) {
    return this.studentRepository.removeStudent(studentId);
  }

  async getStudentsByStatus(status) {
    const students = await this.studentRepository.getStudentsByStatus(status);
    return sortStudentsByFirstName(students);
  }

  async getAllStudents() {
    const students = await this.studentRepository.getAllStudents();
    return sortStudentsByFirstName(students);
  }

  async addBalance(studentId, amount) {
    if (amount <= 0) {
      throw new Error("Amount to add must be greater than zero");
    }

    const student = await this.studentRepository.getStudentById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const currentBalance = student.balance || 0;
    const newBalance = currentBalance + amount;

    return this.studentRepository.updateStudent(studentId, { balance: newBalance });
  }

  async reduceBalance(studentId, amount) {
    if (amount <= 0) {
      throw new Error("Amount to reduce must be greater than zero");
    }

    const student = await this.studentRepository.getStudentById(studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    const currentBalance = student.balance || 0;
    if (currentBalance < amount) {
      throw new Error("Cannot reduce balance below zero");
    }

    const newBalance = currentBalance - amount;
    return this.studentRepository.updateStudent(studentId, { balance: newBalance });
  }
}

// Export a default instance using the real repository
export const studentService = new StudentService(studentRepository);