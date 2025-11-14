import { uploadFile, fileExists, normalizeObjectStoragePath } from "./storage-service.js";
import fs from "fs/promises";
import path from "path";

interface BrandAsset {
  sourcePath: string;
  storagePath: string;
  contentType: string;
}

const BRAND_ASSETS: BrandAsset[] = [
  {
    sourcePath: "server/assets/tradeease-logo.png",
    storagePath: "assets/tradeease-logo.png",
    contentType: "image/png",
  },
];

export async function initializeBrandAssets(): Promise<void> {
  console.log("🎨 Initializing brand assets...");

  for (const asset of BRAND_ASSETS) {
    try {
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      
      if (bucketId) {
        const fullPath = `public/${asset.storagePath}`;
        const objectPath = normalizeObjectStoragePath(fullPath);
        const exists = await fileExists(objectPath);

        if (!exists) {
          console.log(`📤 Uploading ${asset.storagePath} to object storage...`);
          const sourceFullPath = path.join(process.cwd(), asset.sourcePath);
          const buffer = await fs.readFile(sourceFullPath);
          await uploadFile(asset.storagePath, buffer, asset.contentType);
          console.log(`✅ Uploaded ${asset.storagePath}`);
        } else {
          console.log(`✓ ${asset.storagePath} already exists in object storage`);
        }
      } else {
        const sourceFullPath = path.join(process.cwd(), asset.sourcePath);
        const destPath = path.join(process.cwd(), "storage", asset.storagePath);
        const destDir = path.dirname(destPath);
        
        await fs.mkdir(destDir, { recursive: true });
        await fs.copyFile(sourceFullPath, destPath);
        console.log(`✅ Copied ${asset.storagePath} to local storage (dev mode)`);
      }
    } catch (error) {
      console.error(`❌ Failed to initialize asset ${asset.storagePath}:`, error);
    }
  }

  console.log("✅ Brand assets initialized");
}
