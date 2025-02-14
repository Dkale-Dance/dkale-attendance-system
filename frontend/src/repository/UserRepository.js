class UserRepository {
  constructor(db) {
    this.db = db;
    this.collectionName = 'users';
  }

  async findStudents() {
    const querySnapshot = await this.db.collection(this.collectionName)
      .where('role', '==', 'student')
      .get();

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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

  async updateRole(id, role) {
    return this.update(id, { role });
  }

  async getRole(id) {
    const user = await this.findById(id);
    return user ? user.role : 'anonymous';
  }
}

export { UserRepository };