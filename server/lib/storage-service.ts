// Simple object storage service for storing images, logos, and PDFs
// Reference: javascript_object_storage blueprint from Replit
import { Storage, File } from "@google-cloud/storage";

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
 * Upload a file buffer to object storage
 * @param filePath - Path relative to bucket (e.g., "images/report-123.jpg")
 * @param buffer - File buffer to upload
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @returns Full path in object storage
 */
export async function uploadFile(
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    // Get bucket ID from environment
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
    }

    // Parse bucket name from ID (format: replit-objstore-xxxxx)
    const bucketName = bucketId;
    const bucket = storageClient.bucket(bucketName);
    const file = bucket.file(`public/${filePath}`);

    // Upload the buffer
    await file.save(buffer, {
      metadata: {
        contentType,
      },
      public: true, // Make files publicly accessible
    });

    console.log(`✅ Uploaded file to object storage: public/${filePath}`);
    // Return relative path (public/...) instead of fully-qualified path
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
