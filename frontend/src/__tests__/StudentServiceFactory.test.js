import { createStudentService } from '../services/StudentServiceFactory';
import { StudentService } from '../services/StudentService';

// Mock Firebase functions at the top level
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn()
}));

// Mock the repositories
jest.mock('../repository/StudentRepository', () => ({
  StudentRepository: jest.fn().mockImplementation(() => ({
    // add any repository methods you need to mock
  }))
}));

jest.mock('../repository/UserRepository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    // add any repository methods you need to mock
  }))
}));

jest.mock('../services/StudentService', () => ({
  StudentService: jest.fn().mockImplementation(() => ({
    // add any service methods you need to mock
  }))
}));

describe('StudentServiceFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates StudentService with correct dependencies', () => {
    const service = createStudentService();
    expect(service).toBeInstanceOf(StudentService);
  });

  it('reuses the same instance when called multiple times', () => {
    const service1 = createStudentService();
    const service2 = createStudentService();
    expect(service1).toBe(service2);
  });

  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});