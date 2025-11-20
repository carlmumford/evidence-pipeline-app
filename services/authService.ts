// In a real-world application, never store passwords or manage sessions this way.
// This is a simplified client-side implementation for demonstration purposes.
// Use a secure backend with a dedicated authentication provider (e.g., Firebase Auth, OAuth).
import type { User } from '../types';

const USERS_KEY = 'app_users';
const SESSION_KEY = 'current_user';

const encoder = new TextEncoder();

const toBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
};

const generateSalt = (): string => {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(saltBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
};

const hashPassword = async (password: string, salt: string): Promise<string> => {
    const data = encoder.encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return toBase64(digest);
};

const normalizeUsername = (username: string): string => username.trim().toLowerCase();

const readUserStore = (): Record<string, { passwordHash: string; salt: string; role: User['role']; createdAt: number }> => {
    try {
        const stored = localStorage.getItem(USERS_KEY);
        if (!stored) return {};
        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to parse user store from localStorage:', error);
        return {};
    }
};

const persistUserStore = (store: ReturnType<typeof readUserStore>) => {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(store));
    } catch (error) {
        console.error('Failed to persist user store to localStorage:', error);
    }
};

const initializeUserStore = async (): Promise<void> => {
    const existingUsers = readUserStore();
    const normalizedAdmin = normalizeUsername('admin');
    const adminUser = existingUsers[normalizedAdmin];

    // Seed the default admin user if missing or incomplete, while preserving any other users.
    if (adminUser && adminUser.passwordHash && adminUser.salt && adminUser.role) {
        return;
    }

    try {
        const salt = generateSalt();
        const passwordHash = await hashPassword('s2ppadmin', salt);
        persistUserStore({
            ...existingUsers,
            [normalizedAdmin]: { passwordHash, salt, role: 'admin' as const, createdAt: Date.now() },
        });
    } catch (error) {
        console.error('Failed to initialize user store in localStorage:', error);
    }
};

let initializationPromise: Promise<void> | null = null;
const ensureInitialized = async () => {
    if (!initializationPromise) {
        initializationPromise = initializeUserStore();
    }
    return initializationPromise;
};

export const authService = {
  /**
   * Initializes the auth service, setting a default admin user if one isn't already stored.
   */
  initialize: async (): Promise<void> => {
    await ensureInitialized();
  },

  /**
   * Retrieves all users from the user store.
   * @returns An array of User objects, without passwords.
   */
  getUsers: async (): Promise<User[]> => {
      await ensureInitialized();
      const userStore = readUserStore();
      return Object.entries(userStore).map(([username, data]) => ({
          username,
          role: data.role
      }));
  },

  /**
   * Adds a new user to the user store.
   * @param user - The user object to add, including username, password, and role.
   * @returns An object indicating success and a message.
   */
  addUser: async (user: Required<User>): Promise<{ success: boolean, message: string }> => {
      if (!user.username || !user.password) {
          return { success: false, message: 'Username and password are required.' };
      }
      await ensureInitialized();

      try {
          const storedUsers = readUserStore();
          const normalizedUsername = normalizeUsername(user.username);

          if (storedUsers[normalizedUsername]) {
              return { success: false, message: 'Username already exists.' };
          }

          const salt = generateSalt();
          const passwordHash = await hashPassword(user.password, salt);

          storedUsers[normalizedUsername] = { passwordHash, salt, role: user.role, createdAt: Date.now() };
          persistUserStore(storedUsers);
          return { success: true, message: 'User added successfully.' };
      } catch (error) {
          console.error('Failed to add user to localStorage:', error);
          return { success: false, message: 'An unexpected error occurred.' };
      }
  },

  /**
   * Deletes a user from the user store.
   * @param username - The username of the user to delete.
   * @returns An object indicating success and a message.
   */
  deleteUser: async (username: string): Promise<{ success: boolean, message: string }> => {
      await ensureInitialized();
      const normalizedUsername = normalizeUsername(username);

      if (normalizedUsername === 'admin') {
          return { success: false, message: "The default 'admin' user cannot be deleted." };
      }
      try {
          const userStore = readUserStore();

          if (!userStore[normalizedUsername]) {
              return { success: false, message: 'User not found.' };
          }

          delete userStore[normalizedUsername];
          persistUserStore(userStore);
          return { success: true, message: 'User deleted successfully.' };
      } catch (error) {
          console.error('Failed to delete user from localStorage:', error);
          return { success: false, message: 'An unexpected error occurred.' };
      }
  },

  /**
   * Attempts to log in the user with the provided credentials.
   * @param username The username to check.
   * @param password The password to check.
   * @returns `true` if login is successful, otherwise `false`.
   */
  login: async (username: string, password: string): Promise<boolean> => {
      await ensureInitialized();

      try {
        const userStore = readUserStore();
        const normalizedUsername = normalizeUsername(username);
        const user = userStore[normalizedUsername];

        if (!user) return false;

        const passwordHash = await hashPassword(password, user.salt);
        if (user.passwordHash === passwordHash) {
            const sessionUser: Omit<User, 'password'> = { username: normalizedUsername, role: user.role };
            const sessionToken = crypto.randomUUID();
            const sessionPayload = { ...sessionUser, token: sessionToken, issuedAt: Date.now() };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));
            return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to process login from localStorage:', error);
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
          if (!sessionData) return null;
          const { username, role } = JSON.parse(sessionData);
          return username && role ? { username, role } : null;
      } catch (error) {
          console.error('Failed to get current user from sessionStorage:', error);
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
  changePassword: async (username: string, currentPassword: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    await ensureInitialized();
    const normalizedUsername = normalizeUsername(username);

    try {
      const userStore = readUserStore();
      const user = userStore[normalizedUsername];

      if (!user) {
        return { success: false, message: 'User not found.' };
      }

      const currentHash = await hashPassword(currentPassword, user.salt);
      if (user.passwordHash !== currentHash) {
        return { success: false, message: 'Current password is incorrect.' };
      }
      if (!newPassword || newPassword.length < 8) {
          return { success: false, message: 'New password must be at least 8 characters long.' };
      }

      const newSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);

      userStore[normalizedUsername] = { ...user, salt: newSalt, passwordHash: newHash };
      persistUserStore(userStore);
      return { success: true, message: 'Password changed successfully.' };
    } catch (error) {
        console.error('Failed to change password in localStorage:', error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
  },
};

// Initialize the service on application load.
void authService.initialize();
