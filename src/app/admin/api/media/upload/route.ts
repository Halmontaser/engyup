import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { exists } from 'fs';
import path from 'path';

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileType(mimeType: string): 'image' | 'audio' | 'unknown' {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return 'audio';
  return 'unknown';
}

function sanitizeFilename(filename: string): string {
  // Remove any non-alphanumeric characters except dots, hyphens, and underscores
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Add timestamp to prevent conflicts
  const timestamp = Date.now();
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);
  return `${timestamp}_${nameWithoutExt}${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = getFileType(file.type);
    if (fileType === 'unknown') {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES].join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Determine upload directory
    const uploadDir = fileType === 'image' ? 'public/media/images' : 'public/media/audio';

    // Ensure directory exists
    if (!(await exists(uploadDir))) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Sanitize filename and generate unique path
    const sanitizedFilename = sanitizeFilename(file.name);
    const filePath = path.join(process.cwd(), uploadDir, sanitizedFilename);

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate URL (relative path for public files)
    const url = `/media/${fileType === 'image' ? 'images' : 'audio'}/${sanitizedFilename}`;

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
        category: fileType,
        url,
        path: filePath,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
      },
      { status: 500 }
    );
  }
}
