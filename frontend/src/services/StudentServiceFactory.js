import { StudentRepository } from '../repository/StudentRepository';
import { UserRepository } from '../repository/UserRepository';
import { StudentService } from './StudentService';

let studentServiceInstance = null;

const createStudentService = () => {
  if (!studentServiceInstance) {
    const studentRepository = new StudentRepository();
    const userRepository = new UserRepository();
    studentServiceInstance = new StudentService(studentRepository, userRepository);
  }
  return studentServiceInstance;
};

export { createStudentService };