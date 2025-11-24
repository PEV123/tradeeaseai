// Storage service for storing images, logos, and PDFs
// Now using Bunny CDN for production storage
import { posix } from "path";
import { promises as fs } from "fs";
import path from "path";
import { uploadToBunny, downloadFromBunny, deleteFromBunny, getBunnyCDNUrl, isBunnyConfigured } from "./bunny-storage";

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
 * @param filePath - Path relative to storage root (e.g., "images/report-123.jpg")
 * @param buffer - File buffer to upload
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @returns Full path for storage reference (e.g., "bunny/images/file.jpg" or "storage/images/file.jpg")
 */
export async function uploadFile(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const isProduction = process.env.NODE_ENV === "production";
  const bunnyConfigured = isBunnyConfigured();

  // In production, require Bunny CDN (deployed apps have ephemeral filesystems)
  if (!bunnyConfigured && isProduction) {
    throw new Error(
      "Bunny CDN is required for production deployments. " +
      "Please configure BUNNY_STORAGE_ZONE_NAME, BUNNY_STORAGE_API_KEY, and BUNNY_CDN_PULL_ZONE_URL."
    );
  }

  // Fall back to filesystem in development only
  if (!bunnyConfigured) {
    console.log(`⚠️ Bunny CDN not configured, using filesystem fallback for: ${filePath}`);
    console.log(`⚠️ WARNING: Filesystem storage is for development only. Files will not persist on deployed apps.`);
    
    // Sanitize the file path to prevent path traversal attacks
    const sanitizedPath = sanitizeFilePath(filePath);
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
    return `storage/${sanitizedPath}`;
  }

  // Use Bunny CDN
  try {
    await uploadToBunny({
      remotePath: filePath,
      buffer,
      contentType,
    });

    console.log(`✅ Uploaded file to Bunny CDN: ${filePath}`);
    return `bunny/${filePath}`;
  } catch (error) {
    console.error(`❌ Failed to upload file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Download a file from Bunny CDN or filesystem as a buffer
 * @param storagePath - Storage path (e.g., "bunny/images/file.jpg" or "storage/images/file.jpg")
 * @returns File buffer
 */
export async function downloadFile(storagePath: string): Promise<Buffer> {
  try {
    // Bunny CDN path
    if (storagePath.startsWith('bunny/')) {
      const remotePath = storagePath.substring(6); // Remove "bunny/" prefix
      return await downloadFromBunny({ remotePath });
    }
    
    // Filesystem path
    if (storagePath.startsWith('storage/')) {
      const fullPath = path.join(process.cwd(), storagePath);
      return await fs.readFile(fullPath);
    }
    
    // Legacy format - try both
    console.warn(`Legacy storage path format: ${storagePath}`);
    const fullPath = path.join(process.cwd(), 'storage', storagePath);
    return await fs.readFile(fullPath);
  } catch (error) {
    console.error(`❌ Failed to download file ${storagePath}:`, error);
    throw error;
  }
}

/**
 * Delete a file from Bunny CDN or filesystem
 * @param storagePath - Storage path (e.g., "bunny/images/file.jpg" or "storage/images/file.jpg")
 */
export async function deleteFile(storagePath: string): Promise<void> {
  try {
    // Bunny CDN path
    if (storagePath.startsWith('bunny/')) {
      const remotePath = storagePath.substring(6); // Remove "bunny/" prefix
      await deleteFromBunny(remotePath);
      console.log(`🗑️  Deleted file from Bunny CDN: ${remotePath}`);
      return;
    }
    
    // Filesystem path
    if (storagePath.startsWith('storage/')) {
      const fullPath = path.join(process.cwd(), storagePath);
      await fs.unlink(fullPath);
      console.log(`🗑️  Deleted file from filesystem: ${storagePath}`);
      return;
    }
    
    // Legacy format
    console.warn(`Legacy storage path format: ${storagePath}`);
    const fullPath = path.join(process.cwd(), 'storage', storagePath);
    await fs.unlink(fullPath);
    console.log(`🗑️  Deleted file from filesystem: ${storagePath}`);
  } catch (error) {
    console.error(`❌ Failed to delete file ${storagePath}:`, error);
    throw error;
  }
}

/**
 * Unified path resolution for storage paths
 * Returns both Bunny CDN URL (if configured) and filesystem fallback path
 * 
 * @param storagePath - Path from database (e.g., "bunny/images/file.jpg", "storage/images/file.jpg")
 * @returns { cdnUrl?: string; filesystemPath: string }
 * @throws Error if path contains traversal attempts
 */
export function resolveStoragePaths(storagePath: string): { cdnUrl?: string; filesystemPath: string } {
  const bunnyConfigured = isBunnyConfigured();
  
  // Sanitize and normalize path
  let sanitized = storagePath.replace(/\\/g, '/');
  sanitized = posix.normalize(sanitized);
  
  // Security: reject path traversal attempts
  if (sanitized.includes('..') || sanitized.includes('/../')) {
    throw new Error('Path traversal not allowed');
  }
  
  // Determine CDN URL
  let cdnUrl: string | undefined;
  
  // Bunny CDN path format: "bunny/images/file.jpg"
  if (sanitized.startsWith('bunny/')) {
    const remotePath = sanitized.substring(6); // Remove "bunny/" prefix
    if (bunnyConfigured) {
      cdnUrl = getBunnyCDNUrl(remotePath);
    }
  }
  
  // Determine filesystem path
  let filesystemPath: string;
  if (sanitized.startsWith('storage/')) {
    // Already filesystem format
    filesystemPath = sanitized;
  } else if (sanitized.startsWith('bunny/')) {
    // Convert: "bunny/images/..." → "storage/images/..."
    filesystemPath = 'storage/' + sanitized.substring(6);
  } else {
    // Legacy format: "images/..." → "storage/images/..."
    filesystemPath = `storage/${sanitized}`;
  }
  
  return { cdnUrl, filesystemPath };
}

/**
 * Helper to convert storage paths to public HTTP URLs
 * Handles both Bunny CDN paths and local filesystem paths
 */
export function getPublicAssetUrl(baseUrl: string, storagePath: string | null): string {
  if (!storagePath) {
    return '';
  }
  
  // Bunny CDN path - return CDN URL directly
  if (storagePath.startsWith('bunny/')) {
    const remotePath = storagePath.substring(6); // Remove "bunny/" prefix
    if (isBunnyConfigured()) {
      return getBunnyCDNUrl(remotePath);
    }
  }
  
  // Filesystem path - convert to HTTP URL via app server
  if (storagePath.startsWith('storage/')) {
    return `${baseUrl}/${storagePath}`;
  }
  
  // Legacy format - assume it's a relative path
  return `${baseUrl}/storage/${storagePath}`;
}
