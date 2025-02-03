const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

class RoleService {
  static async assignRole(uid, role) {
    try {
      await db.collection("users").doc(uid).set({ role });
      console.log(`Role ${role} assigned to user ${uid}`);
    } catch (error) {
      console.error("Error assigning role:", error);
    }
  }
}

// Example Usage
RoleService.assignRole("USER_UID_HERE", "admin");
