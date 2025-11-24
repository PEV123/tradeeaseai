import https from 'https';
import { Readable } from 'stream';

const STORAGE_HOSTNAME = 'syd.storage.bunnycdn.com'; // Sydney region for Australian users
const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME || '';
const ACCESS_KEY = process.env.BUNNY_STORAGE_API_KEY || '';
const CDN_URL = process.env.BUNNY_CDN_PULL_ZONE_URL || '';

interface UploadOptions {
  remotePath: string;
  buffer: Buffer;
  contentType?: string;
}

interface DownloadOptions {
  remotePath: string;
}

/**
 * Upload a file buffer to Bunny CDN Storage
 * @param options Upload options with remotePath, buffer, and optional contentType
 * @returns Promise<string> - The CDN URL of the uploaded file
 */
export async function uploadToBunny(options: UploadOptions): Promise<string> {
  const { remotePath, buffer, contentType = 'application/octet-stream' } = options;

  return new Promise((resolve, reject) => {
    const path = `/${STORAGE_ZONE_NAME}/${remotePath}`;

    const requestOptions = {
      method: 'PUT',
      host: STORAGE_HOSTNAME,
      path: path,
      headers: {
        'AccessKey': ACCESS_KEY,
        'Content-Type': contentType,
        'Content-Length': buffer.length,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk.toString('utf8');
      });

      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          const cdnUrl = `${CDN_URL}/${remotePath}`;
          console.log(`✅ Uploaded to Bunny CDN: ${cdnUrl}`);
          resolve(cdnUrl);
        } else {
          console.error(`❌ Bunny CDN upload failed (${res.statusCode}): ${responseData}`);
          reject(new Error(`Upload failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Bunny CDN upload error:', error);
      reject(error);
    });

    req.write(buffer);
    req.end();
  });
}

/**
 * Download a file from Bunny CDN Storage
 * @param options Download options with remotePath
 * @returns Promise<Buffer> - The file buffer
 */
export async function downloadFromBunny(options: DownloadOptions): Promise<Buffer> {
  const { remotePath } = options;

  return new Promise((resolve, reject) => {
    const path = `/${STORAGE_ZONE_NAME}/${remotePath}`;

    const requestOptions = {
      method: 'GET',
      host: STORAGE_HOSTNAME,
      path: path,
      headers: {
        'AccessKey': ACCESS_KEY,
      },
    };

    https.get(requestOptions, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        } else {
          reject(new Error(`Download failed with status ${res.statusCode}`));
        }
      });
    }).on('error', (error) => {
      console.error('❌ Bunny CDN download error:', error);
      reject(error);
    });
  });
}

/**
 * Delete a file from Bunny CDN Storage
 * @param remotePath Path in storage (e.g., "images/file.jpg")
 * @returns Promise<void>
 */
export async function deleteFromBunny(remotePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const path = `/${STORAGE_ZONE_NAME}/${remotePath}`;

    const requestOptions = {
      method: 'DELETE',
      host: STORAGE_HOSTNAME,
      path: path,
      headers: {
        'AccessKey': ACCESS_KEY,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk.toString('utf8');
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          console.log(`🗑️  Deleted from Bunny CDN: ${remotePath}`);
          resolve();
        } else {
          console.error(`❌ Bunny CDN delete failed (${res.statusCode}): ${responseData}`);
          reject(new Error(`Delete failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Bunny CDN delete error:', error);
      reject(error);
    });

    req.end();
  });
}

/**
 * Generate public CDN URL for a file
 * @param remotePath Path in storage (e.g., "images/file.jpg")
 * @returns string - The public CDN URL
 */
export function getBunnyCDNUrl(remotePath: string): string {
  // Ensure CDN_URL doesn't end with slash and remotePath doesn't start with one
  const baseUrl = CDN_URL.endsWith('/') ? CDN_URL.slice(0, -1) : CDN_URL;
  const path = remotePath.startsWith('/') ? remotePath.substring(1) : remotePath;
  return `${baseUrl}/${path}`;
}

/**
 * Check if Bunny CDN is configured
 */
export function isBunnyConfigured(): boolean {
  return !!(STORAGE_ZONE_NAME && ACCESS_KEY && CDN_URL);
}
