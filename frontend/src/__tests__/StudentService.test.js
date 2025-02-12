import { StudentService } from '../services/StudentService';

describe('StudentService', () => {
  let service;
  let mockStudentRepository;
  let mockUserRepository;

  beforeEach(() => {
    mockStudentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    };

    mockUserRepository = {
      updateUserRole: jest.fn()
    };

    service = new StudentService(mockStudentRepository, mockUserRepository);
  });

  test('should create a student and update user role', async () => {
    // Arrange
    const studentData = {
      userId: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };
    const createdStudent = { ...studentData, id: 'student123' };
    mockStudentRepository.findByUserId.mockResolvedValue(null);
    mockStudentRepository.create.mockResolvedValue(createdStudent);

    // Act
    const result = await service.createStudent(studentData);

    // Assert
    expect(mockStudentRepository.create).toHaveBeenCalledWith(studentData);
    expect(mockUserRepository.updateUserRole).toHaveBeenCalledWith('user123', 'student');
    expect(result).toEqual(createdStudent);
  });

  test('should not create student if user already has profile', async () => {
    // Arrange
    const studentData = {
      userId: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };
    mockStudentRepository.findByUserId.mockResolvedValue({ id: 'existing123' });

    // Act & Assert
    await expect(service.createStudent(studentData))
      .rejects
      .toThrow('User already has a student profile');
    expect(mockStudentRepository.create).not.toHaveBeenCalled();
  });

  test('should delete student with zero balance', async () => {
    // Arrange
    const studentId = 'student123';
    mockStudentRepository.findById.mockResolvedValue({
      id: studentId,
      balance: 0
    });

    // Act
    await service.deleteStudent(studentId);

    // Assert
    expect(mockStudentRepository.delete).toHaveBeenCalledWith(studentId);
  });

  test('should not delete student with balance', async () => {
    // Arrange
    const studentId = 'student123';
    mockStudentRepository.findById.mockResolvedValue({
      id: studentId,
      balance: 100
    });

    // Act & Assert
    await expect(service.deleteStudent(studentId))
      .rejects
      .toThrow('Cannot delete student with outstanding balance');
    expect(mockStudentRepository.delete).not.toHaveBeenCalled();
  });

  test('should update student details', async () => {
    // Arrange
    const studentId = 'student123';
    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith'
    };
    mockStudentRepository.findById.mockResolvedValue({ id: studentId });
    mockStudentRepository.update.mockResolvedValue({
      id: studentId,
      ...updateData
    });

    // Act
    const result = await service.updateStudent(studentId, updateData);

    // Assert
    expect(mockStudentRepository.update).toHaveBeenCalledWith(studentId, updateData);
    expect(result.firstName).toBe('Jane');
    expect(result.lastName).toBe('Smith');
  });

  test('should throw error when updating non-existent student', async () => {
    // Arrange
    mockStudentRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(service.updateStudent('nonexistent', {}))
      .rejects
      .toThrow('Student not found');
  });
});