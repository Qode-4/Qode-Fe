const LOGIN_TRANSITION_USER_NAME_KEY = 'loginTransitionUserName';

export const authTransitionStorage = {
  getLoginTransitionUserName(): string | null {
    try {
      return sessionStorage.getItem(LOGIN_TRANSITION_USER_NAME_KEY);
    } catch {
      return null;
    }
  },
  setLoginTransitionUserName(name: string): void {
    try {
      sessionStorage.setItem(LOGIN_TRANSITION_USER_NAME_KEY, name);
    } catch {
      // noop
    }
  },
  clearLoginTransitionUserName(): void {
    try {
      sessionStorage.removeItem(LOGIN_TRANSITION_USER_NAME_KEY);
    } catch {
      // noop
    }
  }
};
