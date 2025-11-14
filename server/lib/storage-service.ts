// Simple object storage service for storing images, logos, and PDFs
// Reference: javascript_object_storage blueprint from Replit
import { Storage, File } from "@google-cloud/storage";
import { posix } from "path";
import { promises as fs } from "fs";
import path from "path";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Initialize Google Cloud Storage client for Replit
export const storageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

/**
 * Parse object path into bucket name and object name
 * Format: /bucket-name/path/to/file.ext
 */
function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return { bucketName, objectName };
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
 * Upload a file buffer to object storage or filesystem fallback
 * @param filePath - Path relative to bucket (e.g., "images/report-123.jpg")
 * @param buffer - File buffer to upload
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @returns Full path in object storage or filesystem
 */
export async function uploadFile(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  const isProduction = process.env.NODE_ENV === "production";

  // In production, require object storage (deployed apps have ephemeral filesystems)
  if (!bucketId && isProduction) {
    throw new Error(
      "Object storage is required for production deployments. " +
      "Please configure DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variable."
    );
  }

  // Fall back to filesystem in development only
  if (!bucketId) {
    console.log(`⚠️ Object storage not configured, using filesystem fallback for: ${filePath}`);
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

  // Use object storage
  try {
    const bucketName = bucketId;
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(`public/${filePath}`);

    // Upload the buffer (no public ACL - access controlled by bucket IAM)
    await file.save(buffer, {
      metadata: {
        contentType,
      },
    });

    console.log(`✅ Uploaded file to object storage: public/${filePath}`);
    return `public/${filePath}`;
  } catch (error) {
    console.error(`❌ Failed to upload file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Download a file from object storage as a buffer
 * @param filePath - Full path in object storage (e.g., "/bucket-id/public/images/file.jpg")
 * @returns File buffer
 */
export async function downloadFile(filePath: string): Promise<Buffer> {
  try {
    const { bucketName, objectName } = parseObjectPath(filePath);
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);

    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    console.error(`❌ Failed to download file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Check if a file exists in object storage
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const { bucketName, objectName } = parseObjectPath(filePath);
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error(`❌ Failed to check file existence ${filePath}:`, error);
    return false;
  }
}

/**
 * Delete a file from object storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const { bucketName, objectName } = parseObjectPath(filePath);
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(objectName);
    await file.delete();
    console.log(`🗑️  Deleted file from object storage: ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to delete file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Normalize storage path to fully-qualified object storage path
 * Handles legacy, new object storage formats, and gracefully passes through filesystem paths
 * @param storagePath - Path from database (e.g., "public/images/file.jpg", "/bucket-id/public/images/file.jpg", or "storage/images/file.jpg")
 * @returns Fully-qualified path for object storage operations or original path for filesystem
 */
export function normalizeObjectStoragePath(storagePath: string): string {
  // Already fully-qualified (legacy object storage format)
  if (storagePath.startsWith('/')) {
    return storagePath;
  }
  
  // New object storage format - prepend bucket ID
  if (storagePath.startsWith('public/')) {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      // Gracefully passthrough if bucket not configured (dev/local mode)
      // Caller will treat as filesystem path and fall back to fs.readFile()
      return storagePath;
    }
    return `/${bucketId}/${storagePath}`;
  }
  
  // Local filesystem path (e.g., "storage/images/file.jpg") - passthrough unchanged
  // Caller should handle filesystem vs object storage logic
  return storagePath;
}

/**
 * Unified path resolution for storage paths
 * Returns both object storage path (if bucket configured) and filesystem fallback path
 * 
 * @param storagePath - Path from database or URL (e.g., "public/images/file.jpg", "/bucket/public/...", "storage/...")
 * @returns { objectPath?: string; filesystemPath: string }
 * @throws Error if path contains traversal attempts
 */
export function resolveStoragePaths(storagePath: string): { objectPath?: string; filesystemPath: string } {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  
  // Sanitize and normalize path
  let sanitized = storagePath.replace(/\\/g, '/');
  sanitized = posix.normalize(sanitized);
  
  // Security: reject path traversal attempts
  if (sanitized.includes('..') || sanitized.includes('/../')) {
    throw new Error('Path traversal not allowed');
  }
  
  // Determine object storage path
  let objectPath: string | undefined;
  
  // Always preserve fully-qualified paths (regardless of env var)
  if (sanitized.startsWith('/')) {
    objectPath = sanitized;
  } else if (bucketId) {
    // Generate object path only when bucket configured
    if (sanitized.startsWith('public/')) {
      // New format: "public/..." → "/bucket/public/..."
      objectPath = `/${bucketId}/${sanitized}`;
    } else if (!sanitized.startsWith('storage/')) {
      // URL format: "images/..." → "/bucket/public/images/..."
      objectPath = `/${bucketId}/public/${sanitized}`;
    }
    // If starts with "storage/", no object path (filesystem only)
  }
  
  // Determine filesystem path
  let filesystemPath: string;
  if (sanitized.startsWith('storage/')) {
    // Already filesystem format
    filesystemPath = sanitized;
  } else if (sanitized.startsWith('/')) {
    // Extract from fully-qualified object storage path
    // Try to match "/bucket/public/..." format
    const publicMatch = sanitized.match(/\/[^\/]+\/public\/(.+)$/);
    if (publicMatch) {
      // "/bucket/public/images/..." → "storage/images/..."
      filesystemPath = `storage/${publicMatch[1]}`;
    } else {
      // Path like "/bucket/foo.pdf" without public/ - extract after first /
      const pathWithoutBucket = sanitized.substring(sanitized.indexOf('/', 1) + 1);
      filesystemPath = pathWithoutBucket ? `storage/${pathWithoutBucket}` : 'storage/unknown';
    }
  } else if (sanitized.startsWith('public/')) {
    // Convert: "public/images/..." → "storage/images/..."
    filesystemPath = 'storage/' + sanitized.substring(7);
  } else {
    // URL format: "images/..." → "storage/images/..."
    filesystemPath = `storage/${sanitized}`;
  }
  
  return { objectPath, filesystemPath };
}

/**
 * Helper to convert storage paths to public HTTP URLs
 * Handles both object storage paths and local filesystem paths
 */
export function getPublicAssetUrl(baseUrl: string, storagePath: string | null): string {
  if (!storagePath) {
    return '';
  }
  
  // If path starts with /, it's a legacy object storage path like "/bucket-id/public/logos/file.png"
  // Convert to HTTP URL: "https://host/storage/logos/file.png"
  if (storagePath.startsWith('/')) {
    const match = storagePath.match(/\/[^\/]+\/public\/(.+)$/);
    if (match) {
      return `${baseUrl}/storage/${match[1]}`;
    }
  }
  
  // If path starts with "public/", it's a new object storage path like "public/images/file.jpg"
  // Convert to HTTP URL: "https://host/storage/images/file.jpg"
  if (storagePath.startsWith('public/')) {
    return `${baseUrl}/storage/${storagePath.substring(7)}`; // Remove "public/" prefix
  }
  
  // Otherwise it's a local filesystem path like "storage/logos/file.png"
  // Convert to HTTP URL: "https://host/storage/logos/file.png"
  if (storagePath.startsWith('storage/')) {
    return `${baseUrl}/${storagePath}`;
  }
  
  return `${baseUrl}/storage/${storagePath}`;
}
