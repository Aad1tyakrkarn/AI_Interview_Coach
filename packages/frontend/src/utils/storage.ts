export function getItem<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    console.error('Failed to remove from localStorage');
  }
}

export function clear(): void {
  try {
    localStorage.clear();
  } catch {
    console.error('Failed to clear localStorage');
  }
}
