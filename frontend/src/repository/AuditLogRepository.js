import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit, startAfter } from "firebase/firestore";
import app from "../lib/firebase/config/config";

export class AuditLogRepository {
  constructor() {
    try {
      this.db = getFirestore(app);
    } catch (error) {
      console.error("Error initializing Firestore:", error);
      // For tests, provide a mock db
      this.db = {};
    }
    this.collectionName = "auditLogs";
  }

  /**
   * Logs an audit event to Firestore
   * @param {Object} logData - Object containing log information
   * @param {string} logData.type - Type of event (ATTENDANCE_CHANGE, PAYMENT_CHANGE, FEE_CHANGE, etc.)
   * @param {string} logData.userId - ID of user who performed the action
   * @param {string} logData.entityId - ID of entity affected (usually studentId)
   * @param {Date} logData.timestamp - Timestamp of the event
   * @param {Object} logData.details - Additional details about the event
   * @returns {Promise<Object>} Object containing the new log ID
   */
  async logEvent(logData) {
    try {
      const logsRef = collection(this.db, this.collectionName);
      
      // Ensure we have a timestamp
      const timestamp = logData.timestamp || new Date();
      
      // Create the log document with the provided timestamp
      const logDocRef = await addDoc(logsRef, {
        ...logData,
        timestamp: timestamp
      });
      
      return { id: logDocRef.id };
    } catch (error) {
      console.error("Error logging audit event:", error);
      throw new Error(`Failed to log audit event: ${error.message}`);
    }
  }

  /**
   * Retrieves audit logs for a specific entity (e.g., student) with pagination
   * @param {string} entityId - ID of the entity (student)
   * @param {number} pageNumber - Page number (1-based)
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Object>} Object containing logs, total count, and whether more logs exist
   */
  async getLogsByEntityId(entityId, pageNumber = 1, pageSize = 10) {
    try {
      const logsRef = collection(this.db, this.collectionName);
      
      // Create the base query
      let q = query(
        logsRef,
        where("entityId", "==", entityId),
        orderBy("timestamp", "desc")
      );
      
      // Handle pagination
      if (pageNumber > 1) {
        // Get the last document from the previous page to use as a cursor
        const prevPageQuery = query(
          logsRef,
          where("entityId", "==", entityId),
          orderBy("timestamp", "desc"),
          limit((pageNumber - 1) * pageSize)
        );
        
        const prevPageSnapshot = await getDocs(prevPageQuery);
        const lastVisibleDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        
        // Apply pagination using startAfter
        q = query(
          logsRef,
          where("entityId", "==", entityId),
          orderBy("timestamp", "desc"),
          startAfter(lastVisibleDoc),
          limit(pageSize)
        );
      } else {
        // First page
        q = query(
          logsRef,
          where("entityId", "==", entityId),
          orderBy("timestamp", "desc"),
          limit(pageSize)
        );
      }
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      
      // Transform the results
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JavaScript Date for easier client-side handling
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }));
      
      // Determine if there are more logs to fetch
      // This is a simple approach - a more optimized approach would be to fetch pageSize+1
      // and if we get pageSize+1 items, we know there are more
      const hasMore = logs.length === pageSize;
      
      return {
        logs,
        totalCount: logs.length,
        hasMore
      };
    } catch (error) {
      console.error("Error fetching logs by entity ID:", error);
      throw new Error(`Failed to fetch logs by entity ID: ${error.message}`);
    }
  }

  /**
   * Retrieves audit logs for a specific user with pagination
   * @param {string} userId - ID of the user who performed actions
   * @param {number} pageNumber - Page number (1-based)
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Object>} Object containing logs, total count, and whether more logs exist
   */
  async getLogsByUserId(userId, pageNumber = 1, pageSize = 10) {
    try {
      const logsRef = collection(this.db, this.collectionName);
      
      // Create the base query
      let q = query(
        logsRef,
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      );
      
      // Handle pagination
      if (pageNumber > 1) {
        // Get the last document from the previous page to use as a cursor
        const prevPageQuery = query(
          logsRef,
          where("userId", "==", userId),
          orderBy("timestamp", "desc"),
          limit((pageNumber - 1) * pageSize)
        );
        
        const prevPageSnapshot = await getDocs(prevPageQuery);
        const lastVisibleDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        
        // Apply pagination using startAfter
        q = query(
          logsRef,
          where("userId", "==", userId),
          orderBy("timestamp", "desc"),
          startAfter(lastVisibleDoc),
          limit(pageSize)
        );
      } else {
        // First page
        q = query(
          logsRef,
          where("userId", "==", userId),
          orderBy("timestamp", "desc"),
          limit(pageSize)
        );
      }
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      
      // Transform the results
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }));
      
      // Determine if there are more logs to fetch
      const hasMore = logs.length === pageSize;
      
      return {
        logs,
        totalCount: logs.length,
        hasMore
      };
    } catch (error) {
      console.error("Error fetching logs by user ID:", error);
      throw new Error(`Failed to fetch logs by user ID: ${error.message}`);
    }
  }

  /**
   * Retrieves audit logs of a specific type with pagination
   * @param {string} logType - Type of log (e.g., 'ATTENDANCE_CHANGE')
   * @param {number} pageNumber - Page number (1-based)
   * @param {number} pageSize - Number of items per page
   * @returns {Promise<Object>} Object containing logs, total count, and whether more logs exist
   */
  async getLogsByType(logType, pageNumber = 1, pageSize = 10) {
    try {
      const logsRef = collection(this.db, this.collectionName);
      
      // Create the base query
      let q = query(
        logsRef,
        where("type", "==", logType),
        orderBy("timestamp", "desc")
      );
      
      // Handle pagination
      if (pageNumber > 1) {
        // Get the last document from the previous page to use as a cursor
        const prevPageQuery = query(
          logsRef,
          where("type", "==", logType),
          orderBy("timestamp", "desc"),
          limit((pageNumber - 1) * pageSize)
        );
        
        const prevPageSnapshot = await getDocs(prevPageQuery);
        const lastVisibleDoc = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
        
        // Apply pagination using startAfter
        q = query(
          logsRef,
          where("type", "==", logType),
          orderBy("timestamp", "desc"),
          startAfter(lastVisibleDoc),
          limit(pageSize)
        );
      } else {
        // First page
        q = query(
          logsRef,
          where("type", "==", logType),
          orderBy("timestamp", "desc"),
          limit(pageSize)
        );
      }
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      
      // Transform the results
      const logs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }));
      
      // Determine if there are more logs to fetch
      const hasMore = logs.length === pageSize;
      
      return {
        logs,
        totalCount: logs.length,
        hasMore
      };
    } catch (error) {
      console.error("Error fetching logs by type:", error);
      throw new Error(`Failed to fetch logs by type: ${error.message}`);
    }
  }
}

// Export a singleton instance
export const auditLogRepository = new AuditLogRepository();