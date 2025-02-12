class StudentRepository {
    constructor(db) {
      this.db = db;
      this.collectionName = 'students';
    }
  
    async create(studentData) {
      const studentsRef = this.db.collection(this.collectionName);
      const docRef = studentsRef.doc();
      
      const student = {
        id: docRef.id,
        ...studentData,
        balance: 0,
        enrollmentStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
  
      await docRef.set(student);
      return student;
    }
  
    async findByUserId(userId) {
      const querySnapshot = await this.db.collection(this.collectionName)
        .where('userId', '==', userId)
        .get();
  
      if (querySnapshot.empty) {
        return null;
      }
  
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
  
    async findById(id) {
      const docRef = this.db.collection(this.collectionName).doc(id);
      const doc = await docRef.get();
  
      if (!doc.exists) {
        return null;
      }
  
      return {
        id: doc.id,
        ...doc.data()
      };
    }
  
    async update(id, updateData) {
      const docRef = this.db.collection(this.collectionName).doc(id);
      const updates = {
        ...updateData,
        updatedAt: new Date()
      };
  
      await docRef.update(updates);
      return this.findById(id);
    }
  
    async delete(id) {
      const docRef = this.db.collection(this.collectionName).doc(id);
      await docRef.delete();
    }
  
    async findAll() {
      const snapshot = await this.db.collection(this.collectionName).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  }
  
  export { StudentRepository };