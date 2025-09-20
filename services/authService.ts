// In a real-world application, never store passwords or manage sessions this way.
// This is a simplified client-side implementation for demonstration purposes.
// Use a secure backend with a dedicated authentication provider (e.g., Firebase Auth, OAuth).

const PASSWORD_KEY = 'admin_password';
const SESSION_KEY = 'admin_session';

export const authService = {
  /**
   * Initializes the auth service, setting a default password if one isn't already stored.
   */
  initialize: (): void => {
    if (!localStorage.getItem(PASSWORD_KEY)) {
      localStorage.setItem(PASSWORD_KEY, 'admin');
    }
  },

  /**
   * Attempts to log in the user with the provided credentials.
   * @param username The username to check.
   * @param password The password to check.
   * @returns `true` if login is successful, otherwise `false`.
   */
  login: (username: string, password: string): boolean => {
    const storedPassword = localStorage.getItem(PASSWORD_KEY) || 'admin';
    if (username.toLowerCase() === 'admin' && password === storedPassword) {
      // Use sessionStorage to keep the user logged in only for the current session.
      sessionStorage.setItem(SESSION_KEY, 'true');
      return true;
    }
    return false;
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
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  },

  /**
   * Changes the administrator password.
   * @param currentPassword The user's current password for verification.
   * @param newPassword The new password to set.
   * @returns An object with a success flag and a message.
   */
  changePassword: (currentPassword: string, newPassword: string): { success: boolean, message: string } => {
    const storedPassword = localStorage.getItem(PASSWORD_KEY) || 'admin';
    if (currentPassword !== storedPassword) {
      return { success: false, message: 'Current password is incorrect.' };
    }
    if (!newPassword || newPassword.length < 4) {
        return { success: false, message: 'New password must be at least 4 characters long.' };
    }
    localStorage.setItem(PASSWORD_KEY, newPassword);
    return { success: true, message: 'Password changed successfully.' };
  },
};

// Initialize the service on application load.
authService.initialize();
