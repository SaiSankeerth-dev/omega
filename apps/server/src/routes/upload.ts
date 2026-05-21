import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { BadRequestError } from '@omega/shared/errors';
import { sendSuccess } from '@omega/shared/response';

export const uploadRouter = Router();

// ── Base64 image upload ────────────────────────────────────────────────────
// In production, use a proper file storage solution (S3, Cloudinary, etc.)
uploadRouter.post(
  '/image',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { image, name } = req.body as { image?: string; name?: string };

    if (!image || typeof image !== 'string') {
      throw new BadRequestError('Image data is required (base64 string)');
    }

    // Validate it's a valid base64 image
    if (!image.startsWith('data:image/')) {
      throw new BadRequestError('Invalid image format. Must be a base64 data URI.');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const sizeInBytes = Buffer.byteLength(image, 'utf8');
    if (sizeInBytes > maxSize) {
      throw new BadRequestError('Image too large. Maximum size is 10MB.');
    }

    // In production, upload to cloud storage and return URL
    // For now, return the data URI directly (store in DB)
    const url = image;

    sendSuccess(res, {
      url,
      name: name || 'upload.png',
      size: sizeInBytes,
    });
  }),
);
