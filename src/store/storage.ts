import * as FileSystem from 'expo-file-system/legacy';

const dir = FileSystem.documentDirectory + 'redux-persist/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

function keyPath(key: string) {
  return dir + key.replace(/[^a-z0-9_-]/gi, '_') + '.json';
}

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const path = keyPath(key);
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;
      return await FileSystem.readAsStringAsync(path);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    await ensureDir();
    await FileSystem.writeAsStringAsync(keyPath(key), value);
  },
  async removeItem(key: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(keyPath(key), { idempotent: true });
    } catch {}
  },
};

export default storage;
