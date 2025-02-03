import AuthService from "../services/AuthService";
import  { FakeAuthRepository }  from "../fakes/FakeAuthRepository"; 


describe("AuthService (Unit Test)", () => {
  let authService;
  let fakeAuthRepository;

  beforeEach(() => {
    fakeAuthRepository = new FakeAuthRepository();
    authService = new AuthService(fakeAuthRepository);
  });

  it("should register a new user", async () => {
    const user = await authService.register("test@example.com", "password123");
    expect(user).toHaveProperty("uid");
    expect(user.email).toBe("test@example.com");
  });

  it("should not allow duplicate registration", async () => {
    await authService.register("test@example.com", "password123");
    await expect(authService.register("test@example.com", "password123"))
      .rejects.toThrow("User already exists");
  });

  it("should log in a registered user", async () => {
    await authService.register("test@example.com", "password123");
    const user = await authService.login("test@example.com", "password123");
    expect(user.email).toBe("test@example.com");
  });

  it("should not log in an unregistered user", async () => {
    await expect(authService.login("unknown@example.com", "password123"))
      .rejects.toThrow("Invalid credentials");
  });

  it("should log out a user", async () => {
    await authService.register("test@example.com", "password123");
    await authService.login("test@example.com", "password123");
    await authService.logout();
    await expect(authService.logout()).rejects.toThrow("No user logged in");
  });
});
