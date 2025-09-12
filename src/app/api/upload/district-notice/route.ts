import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const deviceId = formData.get('deviceId') as string
    const customerId = formData.get('customerId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPG, PNG, WebP) or PDF.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `district-notice-${deviceId || Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('district-notices')
        .upload(fileName, buffer, {
          contentType: file.type,
          duplex: 'half'
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('district-notices')
        .getPublicUrl(fileName)

      const fileUrl = urlData.publicUrl

      // Update device record if deviceId provided
      if (deviceId) {
        const { error: updateError } = await supabase
          .from('devices')
          .update({ 
            district_notice_scan: fileUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', deviceId)

        if (updateError) {
          console.error('Device update error:', updateError)
          // Continue anyway - file was uploaded successfully
        }
      }

      // Log the upload
      await supabase
        .from('audit_logs')
        .insert({
          action: 'district_notice_upload',
          resource_type: 'device',
          resource_id: deviceId,
          user_id: customerId,
          details: {
            filename: file.name,
            fileSize: file.size,
            fileType: file.type,
            uploadUrl: fileUrl
          }
        })

      return NextResponse.json({
        success: true,
        message: 'District notice uploaded successfully',
        data: {
          filename: fileName,
          originalName: file.name,
          url: fileUrl,
          size: file.size,
          type: file.type
        }
      })

    } catch (storageError) {
      console.error('Storage error:', storageError)
      
      // Fallback to local storage if Supabase fails
      const uploadPath = join(process.cwd(), 'public', 'uploads', 'district-notices')
      await writeFile(join(uploadPath, fileName), buffer)
      
      const fileUrl = `/uploads/district-notices/${fileName}`

      return NextResponse.json({
        success: true,
        message: 'District notice uploaded successfully (local storage)',
        data: {
          filename: fileName,
          originalName: file.name,
          url: fileUrl,
          size: file.size,
          type: file.type
        }
      })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}