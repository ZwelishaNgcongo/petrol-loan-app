// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type DocType = 'id_document' | 'bank_statement';
export type ResourceType = 'image' | 'raw';

/**
 * Upload a file buffer to Cloudinary as a private/authenticated asset.
 * Sensitive documents (ID, bank statements) should never be public.
 */
export async function uploadSecureDocument(
  fileBuffer: Buffer,
  userId: string,
  docType: DocType,
  originalFilename: string
): Promise<{
  publicId: string;
  resourceType: ResourceType;
  format: string;
  bytes: number;
}> {
  const isPdf = originalFilename.toLowerCase().endsWith('.pdf');
  const resourceType: ResourceType = isPdf ? 'raw' : 'image';

  const result = await cloudinary.uploader.upload(
    `data:${isPdf ? 'application/pdf' : 'image'};base64,${fileBuffer.toString('base64')}`,
    {
      resource_type: resourceType,
      type: 'authenticated', // not publicly accessible without a signed URL
      folder: `petrol-loan-app/${docType}`,
      public_id: `${userId}_${docType}_${Date.now()}`,
      tags: [docType, userId],
    }
  );

  // Cloudinary doesn't always populate `format` for raw uploads, so fall
  // back to the original file's extension. We NEED a real format string —
  // private_download_url uses it to build the correct resource path.
  const fallbackExt = originalFilename.split('.').pop()?.toLowerCase() || (isPdf ? 'pdf' : 'jpg');
  const format = result.format || fallbackExt;

  return {
    publicId: result.public_id,
    resourceType,
    format,
    bytes: result.bytes,
  };
}

/**
 * Generate a short-lived signed URL so only authorized viewers
 * (e.g. admins reviewing a loan application) can access the document.
 */
export function getSignedDocumentUrl(
  publicId: string,
  resourceType: ResourceType,
  format: string,
  expiresInSeconds: number = 300 // 5 minutes
): string {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type: 'authenticated',
    expires_at: expiresAt,
  });
}

/**
 * Encode upload metadata into a single string we can safely store in the
 * existing idDocumentUrl/bankStatementUrl columns without a DB migration.
 * Format: "<resourceType>|<format>|<publicId>"
 */
export function encodeDocumentRef(resourceType: ResourceType, format: string, publicId: string): string {
  return `${resourceType}|${format}|${publicId}`;
}

export function decodeDocumentRef(ref: string): { resourceType: ResourceType; format: string; publicId: string } | null {
  const parts = ref.split('|');
  if (parts.length !== 3) return null;
  const [resourceType, format, publicId] = parts;
  if (resourceType !== 'image' && resourceType !== 'raw') return null;
  if (!format || !publicId) return null;
  return { resourceType, format, publicId };
}

export default cloudinary;