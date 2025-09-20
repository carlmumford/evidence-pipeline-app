// In a real-world application, never store passwords or manage sessions this way.
// This is a simplified client-side implementation for demonstration purposes.
// Use a secure backend with a dedicated authentication provider (e.g., Firebase Auth, OAuth).
import type { User } from '../types';

type UserStore = Record<string, Omit<User, 'username'>>;

const USERS_KEY = 'app_users';
const SESSION_KEY = 'current_user';

export const authService = {
  /**
   * Initializes the auth service, setting a default admin user if one isn't already stored.
   */
  initialize: (): void => {
    try {
        const users = localStorage.getItem(USERS_KEY);
        if (!users) {
            const defaultUsers: UserStore = {
                admin: { password: 'admin', role: 'admin' }
            };
            localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        }
    } catch (error) {
        console.error("Failed to initialize user store in localStorage:", error);
    }
  },

  /**
   * Retrieves all users from the user store.
   * @returns An array of User objects, without passwords.
   */
  getUsers: (): User[] => {
      try {
          const storedUsers = localStorage.getItem(USERS_KEY);
          if (!storedUsers) return [];
          const userStore: UserStore = JSON.parse(storedUsers);
          return Object.entries(userStore).map(([username, data]) => ({
              username,
              role: data.role
          }));
      } catch (error) {
          console.error("Failed to retrieve users from localStorage:", error);
          return [];
      }
  },

  /**
   * Adds a new user to the user store.
   * @param user - The user object to add, including username, password, and role.
   * @returns An object indicating success and a message.
   */
  addUser: (user: Required<User>): { success: boolean, message: string } => {
      if (!user.username || !user.password) {
          return { success: false, message: 'Username and password are required.' };
      }
      try {
          const storedUsers = localStorage.getItem(USERS_KEY) || '{}';
          const userStore: UserStore = JSON.parse(storedUsers);

          if (userStore[user.username.toLowerCase()]) {
              return { success: false, message: 'Username already exists.' };
          }

          userStore[user.username.toLowerCase()] = { password: user.password, role: user.role };
          localStorage.setItem(USERS_KEY, JSON.stringify(userStore));
          return { success: true, message: 'User added successfully.' };
      } catch (error) {
          console.error("Failed to add user to localStorage:", error);
          return { success: false, message: 'An unexpected error occurred.' };
      }
  },

  /**
   * Deletes a user from the user store.
   * @param username - The username of the user to delete.
   * @returns An object indicating success and a message.
   */
  deleteUser: (username: string): { success: boolean, message: string } => {
      if (username.toLowerCase() === 'admin') {
          return { success: false, message: "The default 'admin' user cannot be deleted." };
      }
      try {
          const storedUsers = localStorage.getItem(USERS_KEY) || '{}';
          const userStore: UserStore = JSON.parse(storedUsers);

          if (!userStore[username.toLowerCase()]) {
              return { success: false, message: "User not found." };
          }

          delete userStore[username.toLowerCase()];
          localStorage.setItem(USERS_KEY, JSON.stringify(userStore));
          return { success: true, message: 'User deleted successfully.' };
      } catch (error) {
          console.error("Failed to delete user from localStorage:", error);
          return { success: false, message: 'An unexpected error occurred.' };
      }
  },

  /**
   * Attempts to log in the user with the provided credentials.
   * @param username The username to check.
   * @param password The password to check.
   * @returns `true` if login is successful, otherwise `false`.
   */
  login: (username: string, password: string): boolean => {
      try {
        const storedUsers = localStorage.getItem(USERS_KEY) || '{}';
        const userStore: UserStore = JSON.parse(storedUsers);
        const user = userStore[username.toLowerCase()];

        if (user && user.password === password) {
            const sessionUser: Omit<User, 'password'> = { username: username.toLowerCase(), role: user.role };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
            return true;
        }
        return false;
      } catch (error) {
        console.error("Failed to process login from localStorage:", error);
        return false;
      }
  },

  /**
   * Logs out the current user by clearing the session.
   */
  logout: (): void => {
    sessionStorage.removeItem(SESSION_KEY);
  },

  /**
   * Checks if a user is currently logged in.
   * @returns `true` if a session is active, otherwise `false`.
   */
  isLoggedIn: (): boolean => {
    return sessionStorage.getItem(SESSION_KEY) !== null;
  },

  /**
   * Gets the currently logged-in user's data.
   * @returns The user object from the session, or null if not logged in.
   */
  getCurrentUser: (): Omit<User, 'password'> | null => {
      try {
          const sessionData = sessionStorage.getItem(SESSION_KEY);
          return sessionData ? JSON.parse(sessionData) : null;
      } catch (error) {
          console.error("Failed to get current user from sessionStorage:", error);
          return null;
      }
  },

  /**
   * Changes a user's password.
   * @param username The username of the user changing their password.
   * @param currentPassword The user's current password for verification.
   * @param newPassword The new password to set.
   * @returns An object with a success flag and a message.
   */
  changePassword: (username: string, currentPassword: string, newPassword: string): { success: boolean, message: string } => {
    try {
      const storedUsers = localStorage.getItem(USERS_KEY) || '{}';
      const userStore: UserStore = JSON.parse(storedUsers);
      const user = userStore[username.toLowerCase()];
      
      if (!user || user.password !== currentPassword) {
        return { success: false, message: 'Current password is incorrect.' };
      }
      if (!newPassword || newPassword.length < 4) {
          return { success: false, message: 'New password must be at least 4 characters long.' };
      }
      
      user.password = newPassword;
      localStorage.setItem(USERS_KEY, JSON.stringify(userStore));
      return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
        console.error("Failed to change password in localStorage:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
  },
};

// Initialize the service on application load.
authService.initialize();
