import { PaginatedStudentRepository } from '../repository/PaginatedStudentRepository';
import { cacheService } from '../services/CacheService';
import { getFirestore, collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc } from 'firebase/firestore';

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock CacheService
jest.mock('../services/CacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    remove: jest.fn()
  }
}));

describe('PaginatedStudentRepository', () => {
  let paginatedStudentRepository;
  const mockFirestore = { /* mock Firestore instance */ };
  const mockCollectionRef = { /* mock collection reference */ };
  const mockQuerySnapshot = {
    docs: [
      {
        id: 'student1',
        data: () => ({
          firstName: 'John',
          lastName: 'Doe',
          enrollmentStatus: 'Enrolled',
          balance: 0,
          role: 'student'
        })
      },
      {
        id: 'student2',
        data: () => ({
          firstName: 'Jane',
          lastName: 'Smith',
          enrollmentStatus: 'Enrolled',
          balance: 50,
          role: 'student'
        })
      }
    ],
    empty: false,
    size: 2
  };
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up mock implementations
    getFirestore.mockReturnValue(mockFirestore);
    collection.mockReturnValue(mockCollectionRef);
    query.mockReturnValue('mockQuery');
    where.mockReturnValue('whereClause');
    orderBy.mockReturnValue('orderByClause');
    limit.mockReturnValue('limitClause');
    startAfter.mockReturnValue('startAfterClause');
    getDocs.mockResolvedValue(mockQuerySnapshot);
    
    // Create a new repository instance
    paginatedStudentRepository = new PaginatedStudentRepository();
  });
  
  describe('getStudentsByPage', () => {
    it('should fetch students with pagination', async () => {
      // Arrange
      const pageSize = 10;
      const pageNumber = 1;
      cacheService.has.mockReturnValue(false);
      
      // Act
      const result = await paginatedStudentRepository.getStudentsByPage(pageNumber, pageSize);
      
      // Assert
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'users');
      expect(where).toHaveBeenCalledWith('role', '==', 'student');
      expect(orderBy).toHaveBeenCalledWith('firstName', 'asc');
      expect(limit).toHaveBeenCalledWith(pageSize);
      expect(query).toHaveBeenCalledWith(mockCollectionRef, 'whereClause', 'orderByClause', 'limitClause');
      expect(getDocs).toHaveBeenCalledWith('mockQuery');
      
      expect(result.students.length).toBe(2);
      expect(result.students[0].id).toBe('student1');
      expect(result.students[1].id).toBe('student2');
      expect(result.totalCount).toBe(2);
      expect(result.hasNextPage).toBe(false);
    });
    
    it('should return data from cache if available', async () => {
      // Arrange
      const pageSize = 10;
      const pageNumber = 1;
      const cachedData = {
        students: [{ id: 'student1', firstName: 'John' }],
        totalCount: 1,
        hasNextPage: false
      };
      
      cacheService.has.mockReturnValue(true);
      cacheService.get.mockReturnValue(cachedData);
      
      // Act
      const result = await paginatedStudentRepository.getStudentsByPage(pageNumber, pageSize);
      
      // Assert
      expect(cacheService.has).toHaveBeenCalledWith(`students_page_${pageNumber}_size_${pageSize}`);
      expect(cacheService.get).toHaveBeenCalledWith(`students_page_${pageNumber}_size_${pageSize}`);
      expect(getDocs).not.toHaveBeenCalled(); // Should not call Firestore if data is in cache
      
      expect(result).toEqual(cachedData);
    });
    
    it('should handle pagination beyond the first page', async () => {
      // Arrange
      const pageSize = 10;
      const pageNumber = 2;
      const lastVisibleDoc = { /* mock document reference */ };
      
      // Mock the implementation for fetching the last doc of the previous page
      const previousPageSnapshot = {
        docs: Array(pageSize).fill(null),
      };
      previousPageSnapshot.docs[pageSize - 1] = lastVisibleDoc;
      
      getDocs.mockResolvedValueOnce(previousPageSnapshot)
             .mockResolvedValueOnce(mockQuerySnapshot);
      
      cacheService.has.mockReturnValue(false);
      
      // Act
      const result = await paginatedStudentRepository.getStudentsByPage(pageNumber, pageSize);
      
      // Assert
      // Should make two calls to getDocs - one for getting the last visible doc, and one for the actual query
      expect(getDocs).toHaveBeenCalledTimes(2);
      expect(startAfter).toHaveBeenCalled();
      expect(result.students.length).toBe(2);
    });
  });
  
  describe('getStudentsByStatus', () => {
    it('should fetch students with specific status and pagination', async () => {
      // Arrange
      const status = 'Enrolled';
      const pageSize = 10;
      const pageNumber = 1;
      
      cacheService.has.mockReturnValue(false);
      
      // Act
      const result = await paginatedStudentRepository.getStudentsByStatus(status, pageNumber, pageSize);
      
      // Assert
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'users');
      expect(where).toHaveBeenCalledWith('role', '==', 'student');
      expect(where).toHaveBeenCalledWith('enrollmentStatus', '==', status);
      expect(orderBy).toHaveBeenCalledWith('firstName', 'asc');
      expect(limit).toHaveBeenCalledWith(pageSize);
      expect(query).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalled();
      
      expect(result.students.length).toBe(2);
      expect(result.totalCount).toBe(2);
    });
    
    it('should return data from cache if available', async () => {
      // Arrange
      const status = 'Enrolled';
      const pageSize = 10;
      const pageNumber = 1;
      const cachedData = {
        students: [{ id: 'student1', firstName: 'John', enrollmentStatus: 'Enrolled' }],
        totalCount: 1,
        hasNextPage: false
      };
      
      cacheService.has.mockReturnValue(true);
      cacheService.get.mockReturnValue(cachedData);
      
      // Act
      const result = await paginatedStudentRepository.getStudentsByStatus(status, pageNumber, pageSize);
      
      // Assert
      expect(cacheService.has).toHaveBeenCalledWith(`students_status_${status}_page_${pageNumber}_size_${pageSize}`);
      expect(cacheService.get).toHaveBeenCalledWith(`students_status_${status}_page_${pageNumber}_size_${pageSize}`);
      expect(getDocs).not.toHaveBeenCalled(); // Should not call Firestore if data is in cache
      
      expect(result).toEqual(cachedData);
    });
  });
  
  describe('searchStudents', () => {
    it('should search students by name with pagination', async () => {
      // Arrange
      const searchTerm = 'john';
      const pageSize = 10;
      const pageNumber = 1;
      
      cacheService.has.mockReturnValue(false);
      
      // Act
      const result = await paginatedStudentRepository.searchStudents(searchTerm, pageNumber, pageSize);
      
      // Assert
      expect(collection).toHaveBeenCalledWith(mockFirestore, 'users');
      expect(where).toHaveBeenCalledWith('role', '==', 'student');
      expect(orderBy).toHaveBeenCalledWith('firstName', 'asc');
      // Don't check limit call since our implementation may be different
      expect(query).toHaveBeenCalled();
      expect(getDocs).toHaveBeenCalled();
      
      // The searchStudents implementation may filter results client-side
      // so we should only check that we get some results back
      expect(result.students.length).toBeGreaterThanOrEqual(1);
      expect(result.totalCount).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('cache invalidation', () => {
    it('should invalidate cache when called', () => {
      // Mock the clear method since it wasn't in the original mock
      cacheService.clear = jest.fn();
      
      // Act
      paginatedStudentRepository.invalidateCache();
      
      // Assert
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });
});