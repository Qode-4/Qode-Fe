export type UiFontSize = 'default' | 'large';

export const UI_FONT_SIZE_STORAGE_KEY = 'qode.drawer.fontSize';

export const getStoredUiFontSize = (): UiFontSize => {
  if (typeof window === 'undefined') return 'default';
  const stored = window.localStorage.getItem(UI_FONT_SIZE_STORAGE_KEY);
  return stored === 'default' || stored === 'large' ? stored : 'default';
};

export const applyUiFontSize = (fontSize: UiFontSize): void => {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.fontSize = fontSize;
};

export const persistUiFontSize = (fontSize: UiFontSize): void => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(UI_FONT_SIZE_STORAGE_KEY, fontSize);
  }
  applyUiFontSize(fontSize);
};
