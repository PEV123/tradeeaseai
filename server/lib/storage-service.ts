// Storage service for storing images, logos, and PDFs
// Now using Bunny CDN for production storage
import { posix } from "path";
import { promises as fs } from "fs";
import path from "path";
import { uploadToBunny, downloadFromBunny, deleteFromBunny, getBunnyCDNUrl, isBunnyConfigured } from "./bunny-storage";

/**
 * Normalize storage path to canonical format
 * Strips legacy "bunny/" or "storage/" prefixes if present
 * @param storagePath - Storage path (may have legacy prefixes)
 * @returns Canonical path (e.g., "images/file.jpg")
 */
function normalizeToCanonicalPath(storagePath: string): string {
  let normalized = storagePath.replace(/\\/g, '/');
  
  // Strip legacy prefixes
  if (normalized.startsWith('bunny/')) {
    normalized = normalized.substring(6);
  } else if (normalized.startsWith('storage/')) {
    normalized = normalized.substring(8);
  }
  
  return normalized;
}

/**
 * Sanitize file path to prevent path traversal attacks
 * @param filePath - User-provided file path
 * @returns Sanitized path safe for filesystem operations
 */
function sanitizeFilePath(filePath: string): string {
  // Reject absolute paths
  if (path.isAbsolute(filePath)) {
    throw new Error("Absolute paths are not allowed");
  }

  // Normalize the path to resolve ".." and "." segments
  const normalized = posix.normalize(filePath);

  // Reject any path that still contains ".." after normalization
  if (normalized.includes("..")) {
    throw new Error("Path traversal attempts are not allowed");
  }

  // Reject paths that start with "/" after normalization
  if (normalized.startsWith("/")) {
    throw new Error("Absolute paths are not allowed");
  }

  return normalized;
}

/**
 * Upload a file buffer to Bunny CDN or filesystem fallback
 * @param filePath - Path (canonical or with legacy prefix) (e.g., "images/report-123.jpg", "bunny/logos/client-456.png")
 * @param buffer - File buffer to upload
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @returns Canonical path for database storage (e.g., "images/report-123.jpg")
 */
export async function uploadFile(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const isProduction = process.env.NODE_ENV === "production";
  const bunnyConfigured = isBunnyConfigured();

  // Normalize to canonical path (strip legacy prefixes)
  const canonicalPath = normalizeToCanonicalPath(filePath);
  
  // Sanitize the file path to prevent path traversal attacks
  const sanitizedPath = sanitizeFilePath(canonicalPath);

  // In production, require Bunny CDN (deployed apps have ephemeral filesystems)
  if (!bunnyConfigured && isProduction) {
    throw new Error(
      "Bunny CDN is required for production deployments. " +
      "Please configure BUNNY_STORAGE_ZONE_NAME, BUNNY_STORAGE_API_KEY, and BUNNY_CDN_PULL_ZONE_URL."
    );
  }

  // Fall back to filesystem in development only
  if (!bunnyConfigured) {
    console.log(`⚠️ Bunny CDN not configured, using filesystem fallback for: ${sanitizedPath}`);
    console.log(`⚠️ WARNING: Filesystem storage is for development only. Files will not persist on deployed apps.`);
    
    const storageRoot = path.join(process.cwd(), "storage");
    const fullPath = path.join(storageRoot, sanitizedPath);
    
    // Double-check the final path is still within storage root
    const relativePath = path.relative(storageRoot, fullPath);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      throw new Error("Attempted path traversal detected");
    }
    
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    
    console.log(`✅ Uploaded file to filesystem: storage/${sanitizedPath}`);
    return sanitizedPath; // Return canonical path
  }

  // Use Bunny CDN
  try {
    await uploadToBunny({
      remotePath: sanitizedPath,
      buffer,
      contentType,
    });

    console.log(`✅ Uploaded file to Bunny CDN: ${sanitizedPath}`);
    return sanitizedPath; // Return canonical path
  } catch (error) {
    console.error(`❌ Failed to upload file ${sanitizedPath}:`, error);
    throw error;
  }
}

/**
 * Download a file from Bunny CDN or filesystem as a buffer
 * @param storagePath - Storage path (canonical or with legacy prefix) (e.g., "images/file.jpg", "bunny/images/file.jpg")
 * @returns File buffer
 */
export async function downloadFile(storagePath: string): Promise<Buffer> {
  // Normalize to canonical path (strip legacy prefixes)
  const canonicalPath = normalizeToCanonicalPath(storagePath);
  const bunnyConfigured = isBunnyConfigured();
  
  // Try Bunny CDN first if configured
  if (bunnyConfigured) {
    try {
      return await downloadFromBunny({ remotePath: canonicalPath });
    } catch (error) {
      console.warn(`Failed to download from Bunny CDN, trying filesystem: ${canonicalPath}`);
    }
  }
  
  // Try filesystem fallback
  try {
    const fullPath = path.join(process.cwd(), 'storage', canonicalPath);
    return await fs.readFile(fullPath);
  } catch (error) {
    console.error(`❌ Failed to download file ${storagePath}:`, error);
    throw error;
  }
}

/**
 * Delete a file from Bunny CDN or filesystem
 * @param storagePath - Storage path (canonical or with legacy prefix) (e.g., "images/file.jpg", "bunny/images/file.jpg")
 */
export async function deleteFile(storagePath: string): Promise<void> {
  // Normalize to canonical path (strip legacy prefixes)
  const canonicalPath = normalizeToCanonicalPath(storagePath);
  const bunnyConfigured = isBunnyConfigured();
  
  // Delete from Bunny CDN if configured
  if (bunnyConfigured) {
    try {
      await deleteFromBunny(canonicalPath);
      console.log(`🗑️  Deleted file from Bunny CDN: ${canonicalPath}`);
    } catch (error) {
      console.warn(`Failed to delete from Bunny CDN: ${canonicalPath}`, error);
    }
  }
  
  // Also try to delete from filesystem (cleanup)
  try {
    const fullPath = path.join(process.cwd(), 'storage', canonicalPath);
    await fs.unlink(fullPath);
    console.log(`🗑️  Deleted file from filesystem: ${canonicalPath}`);
  } catch (error) {
    // Ignore filesystem errors if Bunny deletion succeeded
    if (!bunnyConfigured) {
      console.error(`❌ Failed to delete file ${storagePath}:`, error);
      throw error;
    }
  }
}

/**
 * Unified path resolution for storage paths
 * Returns both Bunny CDN URL (if configured) and filesystem fallback path
 * 
 * @param storagePath - Storage path (canonical or with legacy prefix) (e.g., "images/file.jpg", "bunny/images/file.jpg")
 * @returns { cdnUrl?: string; filesystemPath: string }
 * @throws Error if path contains traversal attempts
 */
export function resolveStoragePaths(storagePath: string): { cdnUrl?: string; filesystemPath: string } {
  // Normalize to canonical path (strip legacy prefixes)
  const canonicalPath = normalizeToCanonicalPath(storagePath);
  const bunnyConfigured = isBunnyConfigured();
  
  // Sanitize and normalize path
  let sanitized = canonicalPath.replace(/\\/g, '/');
  sanitized = posix.normalize(sanitized);
  
  // Security: reject path traversal attempts
  if (sanitized.includes('..') || sanitized.includes('/../')) {
    throw new Error('Path traversal not allowed');
  }
  
  // Determine CDN URL if Bunny is configured
  let cdnUrl: string | undefined;
  if (bunnyConfigured) {
    cdnUrl = getBunnyCDNUrl(sanitized);
  }
  
  // Filesystem path
  const filesystemPath = `storage/${sanitized}`;
  
  return { cdnUrl, filesystemPath };
}

/**
 * Helper to convert storage paths to public HTTP URLs
 * Returns Bunny CDN URL if configured, otherwise returns app server URL
 * Handles both canonical paths and legacy prefixed paths
 */
export function getPublicAssetUrl(baseUrl: string, storagePath: string | null): string {
  if (!storagePath) {
    return '';
  }
  
  // Normalize to canonical path (strip legacy prefixes)
  const canonicalPath = normalizeToCanonicalPath(storagePath);
  const bunnyConfigured = isBunnyConfigured();
  
  // If Bunny CDN is configured, return CDN URL
  if (bunnyConfigured) {
    return getBunnyCDNUrl(canonicalPath);
  }
  
  // Otherwise, return app server URL
  return `${baseUrl}/storage/${canonicalPath}`;
}
