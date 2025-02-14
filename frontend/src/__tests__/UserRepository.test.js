import { UserRepository } from '../repository/UserRepository';
// Mock Firebase first
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn()
}));



describe('UserRepository', () => {
  let repository;
  let mockDb;
  let mockCollection;
  let mockDoc;
  
  beforeEach(() => {
    mockDoc = {
      id: 'test-id',
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn()
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
      where: jest.fn()
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };

    repository = new UserRepository(mockDb);
  });

  describe('findStudents', () => {
    it('should return list of students', async () => {
      // Arrange
      const mockStudents = [
        { id: '1', email: 'student1@test.com', role: 'student' },
        { id: '2', email: 'student2@test.com', role: 'student' }
      ];

      const mockQuerySnapshot = {
        docs: mockStudents.map(student => ({
          id: student.id,
          data: () => student,
          exists: true
        }))
      };

      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockQuerySnapshot)
      });

      // Act
      const students = await repository.findStudents();

      // Assert
      expect(mockCollection.where).toHaveBeenCalledWith('role', '==', 'student');
      expect(students).toHaveLength(2);
      expect(students[0].email).toBe('student1@test.com');
    });

    it('should return empty array when no students found', async () => {
      // Arrange
      const mockQuerySnapshot = {
        docs: []
      };

      mockCollection.where.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockQuerySnapshot)
      });

      // Act
      const students = await repository.findStudents();

      // Assert
      expect(students).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update user and return updated data', async () => {
      // Arrange
      const userId = 'test-id';
      const updateData = { email: 'updated@test.com' };
      const updatedUser = { id: userId, ...updateData, role: 'student' };

      mockDoc.get.mockResolvedValue({
        exists: true,
        id: userId,
        data: () => updatedUser
      });

      // Act
      const result = await repository.update(userId, updateData);

      // Assert
      expect(mockDoc.update).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date)
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      // Arrange
      const userId = 'test-id';
      const newRole = 'student';

      mockDoc.get.mockResolvedValue({
        exists: true,
        id: userId,
        data: () => ({ id: userId, role: newRole })
      });

      // Act
      await repository.updateRole(userId, newRole);

      // Assert
      expect(mockDoc.update).toHaveBeenCalledWith({
        role: newRole,
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('getRole', () => {
    it('should return user role when user exists', async () => {
      // Arrange
      const userId = 'test-id';
      const role = 'student';

      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({ role })
      });

      // Act
      const result = await repository.getRole(userId);

      // Assert
      expect(result).toBe('student');
    });

    it('should return anonymous when user does not exist', async () => {
      // Arrange
      mockDoc.get.mockResolvedValue({
        exists: false
      });

      // Act
      const result = await repository.getRole('nonexistent-id');

      // Assert
      expect(result).toBe('anonymous');
    });
  });
});