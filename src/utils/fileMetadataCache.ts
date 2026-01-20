/**
 * File Metadata Cache Service
 * 
 * Caches file/folder metadata in RAM to avoid repeated filesystem operations.
 * Provides quick access to file information when needed by UI components.
 */

export interface FileMetadata {
  path: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: number;
  created?: number;
  isReadonly?: boolean;
  encoding?: string;
  lineCount?: number;
}

export interface CacheEntry {
  metadata: FileMetadata;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

class FileMetadataCache {
  private cache: Map<string, CacheEntry> = new Map();
  private DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Set metadata for a file/folder
   */
  set(path: string, metadata: FileMetadata, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(path, {
      metadata,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get metadata for a file/folder from cache
   */
  get(path: string): FileMetadata | null {
    const entry = this.cache.get(path);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(path);
      return null;
    }

    return entry.metadata;
  }

  /**
   * Set multiple metadata entries at once (e.g., from directory listing)
   */
  setMultiple(entries: Array<[string, FileMetadata]>): void {
    entries.forEach(([path, metadata]) => {
      this.set(path, metadata);
    });
  }

  /**
   * Clear cache entry
   */
  invalidate(path: string): void {
    this.cache.delete(path);
  }

  /**
   * Invalidate all entries matching a pattern (e.g., folder and contents)
   */
  invalidatePattern(pattern: string): void {
    const pathsToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.startsWith(pattern)) {
        pathsToDelete.push(key);
      }
    }

    pathsToDelete.forEach(path => this.cache.delete(path));
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([path, entry]) => ({
        path,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
      })),
    };
  }

  /**
   * Start cleanup timer to remove expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const pathsToDelete: string[] = [];

      for (const [path, entry] of this.cache) {
        if (entry.ttl && now - entry.timestamp > entry.ttl) {
          pathsToDelete.push(path);
        }
      }

      pathsToDelete.forEach(path => this.cache.delete(path));
    }, 60 * 1000); // Run every minute
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy the cache service
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

// Export singleton instance
export const fileMetadataCache = new FileMetadataCache();

export default FileMetadataCache;
