import { getFirestore, collection, doc, getDoc, query, where, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
import app from "../lib/firebase/config/config";
import { cacheService } from "../services/CacheService";

/**
 * Repository for fetching student data with pagination and caching
 */
export class PaginatedStudentRepository {
  constructor() {
    try {
      this.db = getFirestore(app);
    } catch (error) {
      console.error("Error initializing Firestore:", error);
      // For tests, provide a mock db
      this.db = {};
    }
    this.collectionName = "users";
    
    // Cache TTL (5 minutes)
    this.cacheTTL = 5 * 60 * 1000;
  }

  /**
   * Fetch a page of students
   * @param {number} pageNumber - Page number (1-indexed)
   * @param {number} pageSize - Number of students per page
   * @returns {Promise<Object>} Object containing students array, total count, and pagination info
   */
  async getStudentsByPage(pageNumber = 1, pageSize = 10) {
    try {
      // Check cache first
      const cacheKey = `students_page_${pageNumber}_size_${pageSize}`;
      if (cacheService.has(cacheKey)) {
        return cacheService.get(cacheKey);
      }
      
      const usersRef = collection(this.db, this.collectionName);
      
      // Base query - all students ordered by first name
      // Define query constraints
      where("role", "==", "student");
      orderBy("firstName", "asc");
      
      // For pagination beyond first page, we need to get the last document of the previous page
      let lastVisible = null;
      if (pageNumber > 1) {
        // Get the last document from the previous page to use as cursor
        const prevPageQuery = query(
          usersRef,
          where("role", "==", "student"),
          orderBy("firstName", "asc"),
          limit((pageNumber - 1) * pageSize)
        );
        
        const prevPageSnapshot = await getDocs(prevPageQuery);
        
        if (!prevPageSnapshot.empty && prevPageSnapshot.docs.length > 0) {
          lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        } else {
          // If previous page is empty, return empty result
          return {
            students: [],
            totalCount: 0,
            hasNextPage: false
          };
        }
      }
      
      // Build the query with pagination
      let studentsQuery;
      if (lastVisible) {
        studentsQuery = query(
          usersRef,
          where("role", "==", "student"),
          orderBy("firstName", "asc"),
          startAfter(lastVisible),
          limit(pageSize)
        );
      } else {
        studentsQuery = query(
          usersRef,
          where("role", "==", "student"),
          orderBy("firstName", "asc"),
          limit(pageSize)
        );
      }
      
      // Execute the query
      const querySnapshot = await getDocs(studentsQuery);
      
      // Transform the results
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check if there's a next page
      // This is a simple approach assuming pageSize+1 document means there are more
      const hasNextPage = students.length === pageSize;
      
      const result = {
        students,
        totalCount: students.length,
        hasNextPage
      };
      
      // Cache the results
      cacheService.set(cacheKey, result, this.cacheTTL);
      
      return result;
    } catch (error) {
      console.error("Error fetching students by page:", error);
      throw new Error(`Failed to fetch students by page: ${error.message}`);
    }
  }

  /**
   * Fetch students with a specific enrollment status using pagination
   * @param {string} status - Enrollment status to filter by
   * @param {number} pageNumber - Page number (1-indexed)
   * @param {number} pageSize - Number of students per page
   * @returns {Promise<Object>} Object containing students array, total count, and pagination info
   */
  async getStudentsByStatus(status, pageNumber = 1, pageSize = 10) {
    try {
      // Check cache first
      const cacheKey = `students_status_${status}_page_${pageNumber}_size_${pageSize}`;
      if (cacheService.has(cacheKey)) {
        return cacheService.get(cacheKey);
      }
      
      const usersRef = collection(this.db, this.collectionName);
      
      // Base query - students with specific status
      // Define query constraints
      where("role", "==", "student");
      where("enrollmentStatus", "==", status);
      orderBy("firstName", "asc");
      
      // For pagination beyond first page, get the last document of the previous page
      let lastVisible = null;
      if (pageNumber > 1) {
        const prevPageQuery = query(
          usersRef,
          where("role", "==", "student"),
          where("enrollmentStatus", "==", status),
          orderBy("firstName", "asc"),
          limit((pageNumber - 1) * pageSize)
        );
        
        const prevPageSnapshot = await getDocs(prevPageQuery);
        
        if (!prevPageSnapshot.empty && prevPageSnapshot.docs.length > 0) {
          lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        } else {
          // If previous page is empty, return empty result
          return {
            students: [],
            totalCount: 0,
            hasNextPage: false
          };
        }
      }
      
      // Build the query with pagination
      let studentsQuery;
      if (lastVisible) {
        studentsQuery = query(
          usersRef,
          where("role", "==", "student"),
          where("enrollmentStatus", "==", status),
          orderBy("firstName", "asc"),
          startAfter(lastVisible),
          limit(pageSize)
        );
      } else {
        studentsQuery = query(
          usersRef,
          where("role", "==", "student"),
          where("enrollmentStatus", "==", status),
          orderBy("firstName", "asc"),
          limit(pageSize)
        );
      }
      
      // Execute the query
      const querySnapshot = await getDocs(studentsQuery);
      
      // Transform the results
      const students = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check if there's a next page
      const hasNextPage = students.length === pageSize;
      
      const result = {
        students,
        totalCount: students.length,
        hasNextPage
      };
      
      // Cache the results
      cacheService.set(cacheKey, result, this.cacheTTL);
      
      return result;
    } catch (error) {
      console.error("Error fetching students by status:", error);
      throw new Error(`Failed to fetch students by status: ${error.message}`);
    }
  }

  /**
   * Search for students by name with pagination
   * @param {string} searchTerm - Search term to match against names
   * @param {number} pageNumber - Page number (1-indexed)
   * @param {number} pageSize - Number of students per page
   * @returns {Promise<Object>} Object containing students array, total count, and pagination info
   */
  async searchStudents(searchTerm, pageNumber = 1, pageSize = 10) {
    try {
      // Search is case-insensitive
      const searchTermLower = searchTerm.toLowerCase();
      
      // We can't use cache for search since Firestore doesn't support case-insensitive search
      // and we need to do the filtering on the client side
      
      // First get all students
      const usersRef = collection(this.db, this.collectionName);
      
      const studentsQuery = query(
        usersRef,
        where("role", "==", "student"),
        orderBy("firstName", "asc")
      );
      
      const querySnapshot = await getDocs(studentsQuery);
      
      // Filter by search term on the client side
      const allMatchingStudents = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(student => {
          const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
          return fullName.includes(searchTermLower);
        });
      
      // Apply pagination manually
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pagedStudents = allMatchingStudents.slice(startIndex, endIndex);
      
      return {
        students: pagedStudents,
        totalCount: allMatchingStudents.length,
        hasNextPage: endIndex < allMatchingStudents.length
      };
    } catch (error) {
      console.error("Error searching students:", error);
      throw new Error(`Failed to search students: ${error.message}`);
    }
  }

  /**
   * Get a student by ID (always fetches from Firestore to ensure data is current)
   * @param {string} studentId - ID of the student to fetch
   * @returns {Promise<Object|null>} Student object or null if not found
   */
  async getStudentById(studentId) {
    try {
      const userRef = doc(this.db, this.collectionName, studentId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        // Only return if the user is a student
        if (userData.role === "student") {
          return {
            ...userData,
            id: docSnap.id
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching student by ID:", error);
      throw new Error(`Failed to fetch student by ID: ${error.message}`);
    }
  }

  /**
   * Invalidate all cache entries related to students
   */
  invalidateCache() {
    // Since we can't easily get all keys with the current implementation,
    // we'll clear all cache entries to be safe
    cacheService.clear();
    // Alternatively, we could create an array of known cache key patterns and remove them
    // This is a simpler approach for now
  }
}

// Export a singleton instance
export const paginatedStudentRepository = new PaginatedStudentRepository();