// StudentRepository.js
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";

export class StudentRepository {
  constructor() {
    this.db = getFirestore();
    this.collectionName = "users"; // Using the existing users collection
  }

  async getStudentById(studentId) {
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
  }

  async updateStudent(studentId, updateData) {
    const userRef = doc(this.db, this.collectionName, studentId);
    await updateDoc(userRef, updateData);
    return { id: studentId, ...updateData };
  }

  async removeStudent(studentId) {
    // First check if student has zero balance
    const student = await this.getStudentById(studentId);
    
    if (!student) {
      throw new Error("Student not found");
    }
    
    if (student.balance > 0) {
      throw new Error("Cannot remove student with outstanding balance");
    }
    
    // Instead of deleting the document, we update the status to "Removed"
    const userRef = doc(this.db, this.collectionName, studentId);
    await updateDoc(userRef, { enrollmentStatus: "Removed" });
    return true;
  }

  async getStudentsByStatus(enrollmentStatus) {
    const usersRef = collection(this.db, this.collectionName);
    const q = query(
      usersRef, 
      where("role", "==", "student"),
      where("enrollmentStatus", "==", enrollmentStatus)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
  }

  async getAllStudents() {
    const usersRef = collection(this.db, this.collectionName);
    const q = query(usersRef, where("role", "==", "student"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));
  }
}

export const studentRepository = new StudentRepository();