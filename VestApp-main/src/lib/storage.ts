// Safe localStorage wrapper to prevent mobile devices from crashing 
// on browsers with cookies/site data blocked or in strict private/incognito mode.

const createSafeLocalStorage = () => {
  let memoryStorage: Record<string, string> = {};

  const isSupported = (): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__test_storage_support__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  };

  const useRealStorage = isSupported();

  return {
    getItem: (key: string): string | null => {
      if (useRealStorage) {
        try {
          return window.localStorage.getItem(key);
        } catch {
          return memoryStorage[key] || null;
        }
      }
      return memoryStorage[key] || null;
    },
    setItem: (key: string, value: string): void => {
      if (useRealStorage) {
        try {
          window.localStorage.setItem(key, value);
          return;
        } catch (e) {
          console.warn('safeLocalStorage.setItem failed, falling back to memory storage:', e);
        }
      }
      memoryStorage[key] = String(value);
    },
    removeItem: (key: string): void => {
      if (useRealStorage) {
        try {
          window.localStorage.removeItem(key);
          return;
        } catch {
          delete memoryStorage[key];
        }
      }
      delete memoryStorage[key];
    },
    clear: (): void => {
      if (useRealStorage) {
        try {
          window.localStorage.clear();
          return;
        } catch {
          memoryStorage = {};
        }
      }
      memoryStorage = {};
    }
  };
};

export const safeLocalStorage = createSafeLocalStorage();
