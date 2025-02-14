import { AuthService } from '../services/AuthService';

describe('AuthService', () => {
  let service;
  let mockAuthRepository;
  let mockUserRepository;

  beforeEach(() => {
    // Create fresh mocks
    mockAuthRepository = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn()
    };

    mockUserRepository = {
      updateRole: jest.fn(),
      getRole: jest.fn()
    };

    // Create new service instance
    service = new AuthService(mockAuthRepository, mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should login a user and return user with role', async () => {
    // Arrange
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const mockUser = { uid: 'user123', email: testEmail };
    const mockRole = 'student';

    mockAuthRepository.login.mockResolvedValue(mockUser);
    mockUserRepository.getRole.mockResolvedValue(mockRole);

    // Act
    const result = await service.login(testEmail, testPassword);

    // Assert
    expect(mockAuthRepository.login).toHaveBeenCalledWith(testEmail, testPassword);
    expect(mockUserRepository.getRole).toHaveBeenCalledWith(mockUser.uid);
    expect(result).toEqual({
      ...mockUser,
      role: mockRole
    });
  });

  it('should register a new user and assign student role', async () => {
    // Arrange
    const testEmail = 'newuser@example.com';
    const testPassword = 'password123';
    const mockUser = { uid: 'user123', email: testEmail };

    mockAuthRepository.register.mockResolvedValue(mockUser);
    mockUserRepository.updateRole.mockResolvedValue(undefined);
    mockUserRepository.getRole.mockResolvedValue('student');

    // Act
    const result = await service.register(testEmail, testPassword);

    // Assert
    expect(mockAuthRepository.register).toHaveBeenCalledWith(testEmail, testPassword);
    expect(mockUserRepository.updateRole).toHaveBeenCalledWith(mockUser.uid, 'student');
    expect(mockUserRepository.getRole).toHaveBeenCalledWith(mockUser.uid);
    expect(result).toEqual({
      ...mockUser,
      role: 'student'
    });
  });

  it('should handle login errors', async () => {
    // Arrange
    const errorMessage = 'Invalid credentials';
    mockAuthRepository.login.mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(service.login('test@example.com', 'wrong-password'))
      .rejects
      .toThrow(errorMessage);
  });

  it('should handle registration errors', async () => {
    // Arrange
    const errorMessage = 'Email already in use';
    mockAuthRepository.register.mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(service.register('existing@example.com', 'password123'))
      .rejects
      .toThrow(errorMessage);
  });

  it('should call logout on auth repository', async () => {
    // Act
    await service.logout();

    // Assert
    expect(mockAuthRepository.logout).toHaveBeenCalled();
  });
});