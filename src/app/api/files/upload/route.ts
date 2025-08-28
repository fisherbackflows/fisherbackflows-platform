import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handling/error-middleware';
import { fileUploadService } from '@/lib/file-upload/file-upload-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { measureOperation } from '@/lib/monitoring/application-monitor';

const uploadOptionsSchema = z.object({
  category: z.enum(['document', 'image', 'certificate', 'report', 'signature', 'photo']),
  appointmentId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  isPublic: z.boolean().optional().default(false),
  expiresInDays: z.number().min(1).max(365).optional(),
  metadata: z.record(z.any()).optional()
});

async function uploadHandler(request: NextRequest): Promise<NextResponse> {
  return await measureOperation('file_upload', async () => {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const optionsJson = formData.get('options') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate upload options
    let uploadOptions;
    try {
      const rawOptions = optionsJson ? JSON.parse(optionsJson) : {};
      uploadOptions = uploadOptionsSchema.parse(rawOptions);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid upload options' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Prepare upload options
    const fileUploadOptions = {
      ...uploadOptions,
      userId: session.user.id,
      organizationId: session.user.organizationId,
      requiresAuthentication: true,
      expiresAt: uploadOptions.expiresInDays 
        ? new Date(Date.now() + uploadOptions.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      maxSizeBytes: getMaxSizeForCategory(uploadOptions.category)
    };

    // Perform the upload
    const result = await fileUploadService.uploadFile(
      fileBuffer,
      file.name,
      fileUploadOptions
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          securityWarnings: result.securityWarnings 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      file: result.file,
      securityWarnings: result.securityWarnings
    });
  });
}

async function downloadHandler(request: NextRequest): Promise<NextResponse> {
  return await measureOperation('file_download', async () => {
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');
    const inline = url.searchParams.get('inline') === 'true';

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID required' },
        { status: 400 }
      );
    }

    // Get session for access control
    const session = await getServerSession(authOptions);
    
    const { file, hasAccess } = await fileUploadService.getFile(
      fileId,
      session?.user?.id,
      session?.user?.organizationId
    );

    if (!file || !hasAccess) {
      return NextResponse.json(
        { error: 'File not found or access denied' },
        { status: 404 }
      );
    }

    // For public files or when serving download URLs, redirect to storage
    if (file.isPublic || !inline) {
      return NextResponse.redirect(file.url);
    }

    // For private files, create a temporary signed URL
    const signedUrl = await createSignedUrl(file.url, 300); // 5 minutes
    return NextResponse.redirect(signedUrl);
  });
}

function getMaxSizeForCategory(category: string): number {
  const sizeMap = {
    'image': 10 * 1024 * 1024,     // 10MB
    'photo': 10 * 1024 * 1024,     // 10MB  
    'document': 50 * 1024 * 1024,  // 50MB
    'certificate': 25 * 1024 * 1024, // 25MB
    'report': 50 * 1024 * 1024,    // 50MB
    'signature': 2 * 1024 * 1024   // 2MB
  };
  
  return sizeMap[category as keyof typeof sizeMap] || 10 * 1024 * 1024;
}

async function createSignedUrl(url: string, expiresInSeconds: number): Promise<string> {
  // In production, implement proper signed URL generation
  // For Supabase, this would use their signed URL API
  const { supabase } = await import('@/lib/supabase');
  
  try {
    const { data, error } = await supabase.storage
      .from('files')
      .createSignedUrl(url, expiresInSeconds);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    // Fallback to original URL
    return url;
  }
}

// Export handlers with error middleware
export const POST = withErrorHandler(uploadHandler, {
  category: 'file_upload' as any,
  severity: 'high' as any
});

export const GET = withErrorHandler(downloadHandler, {
  category: 'file_upload' as any,
  severity: 'medium' as any
});