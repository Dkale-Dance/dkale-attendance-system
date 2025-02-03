export class FakeAuthRepository {
    constructor() {
      this.users = new Map();
      this.loggedInUser = null;
    }
  
    async register(email, password) {
      if (this.users.has(email)) throw new Error("User already exists");
      const user = { uid: Math.random().toString(36).substr(2, 9), email };
      this.users.set(email, user);
      return user;
    }
  
    async login(email, password) {
      if (!this.users.has(email)) throw new Error("Invalid credentials");
      this.loggedInUser = this.users.get(email);
      return this.loggedInUser;
    }
  
    async logout() {
      if (!this.loggedInUser) throw new Error("No user logged in");
      this.loggedInUser = null;
    }
  }
  