export const SESSION_STORAGE_KEY = 'nextpr_session';

export const hasActiveSession = (): boolean => !!localStorage.getItem(SESSION_STORAGE_KEY);

export const startSession = (email: string): void => {
  localStorage.setItem(SESSION_STORAGE_KEY, email);
};

export const endSession = (): void => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};
