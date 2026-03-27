// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

// Uses global HackHub FileSystem API, Remove this line when importing new modules

// ============================================================================
// SECTION: JSON File Operations
// ============================================================================

export async function readJson<T>(path: string): Promise<T | null> {
  try {
    const content = await FileSystem.ReadFile(path, { absolute: true });
    if (!content) return null;
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function writeJson(path: string, data: unknown): Promise<void> {
  const jsonContent = JSON.stringify(data, null, 2);
  await FileSystem.WriteFile(path, jsonContent, { absolute: true, recursive: true });
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await FileSystem.ReadFile(path, { absolute: true });
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(path: string): Promise<void> {
  try {
    await FileSystem.Remove(path, { absolute: true, recursive: false });
  } catch {
    // Ignore errors if file doesn't exist
  }
}

export async function ensureDir(path: string): Promise<void> {
  await FileSystem.Mkdir(path, { absolute: true, recursive: true });
}

export async function listDir(path: string): Promise<string[]> {
  try {
    // Use ReadDir pattern (like python.ts) - returns objects with .name
    const files = await FileSystem.ReadDir(path, { absolute: true });
    return files.map(f => f.name);
  } catch {
    return [];
  }
}
