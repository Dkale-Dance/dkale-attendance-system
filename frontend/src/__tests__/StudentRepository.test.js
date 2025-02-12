import { StudentRepository } from '../repository/StudentRepository';

// Create a mock db object instead of importing Firebase config
const mockDb = {
  collection: jest.fn()
};

describe('StudentRepository', () => {
  let repository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    repository = new StudentRepository(mockDb);
  });

  it('should create a new student with correct initial values', async () => {
    // Arrange
    const mockStudentData = {
      userId: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    const mockDocRef = {
      id: 'student123',
      set: jest.fn().mockResolvedValue(undefined)
    };

    mockDb.collection.mockReturnValue({
      doc: jest.fn().mockReturnValue(mockDocRef)
    });

    // Act
    const result = await repository.create(mockStudentData);

    // Assert
    expect(mockDb.collection).toHaveBeenCalledWith('students');
    expect(mockDocRef.set).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      balance: 0,
      enrollmentStatus: 'pending'
    }));
    expect(result.id).toBe('student123');
  });

  it('should return null if student not found by userId', async () => {
    // Arrange
    const mockQuerySnapshot = {
      empty: true,
      docs: []
    };

    const mockQuery = {
      get: jest.fn().mockResolvedValue(mockQuerySnapshot)
    };

    mockDb.collection.mockReturnValue({
      where: jest.fn().mockReturnValue(mockQuery)
    });

    // Act
    const result = await repository.findByUserId('nonexistent');

    // Assert
    expect(result).toBeNull();
  });
});