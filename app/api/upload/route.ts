import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const folderId = formData.get('folderId') as string
    const landId = formData.get('landId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if storage bucket exists, if not it will be created automatically
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `documents/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    // Create document record in database
    console.log('[UPLOAD] landId =', landId)
    console.log('[UPLOAD] folderId =', folderId)
    const payload = {
  title,
  description,
  folder_id: folderId ? parseInt(folderId) : null,
  land_id: landId || null,
  file_name: file.name,
  file_path: uploadData.path,
  file_size: file.size,
  file_type: file.type,
}

console.log('[UPLOAD] payload =', payload)

const { data: docData, error: dbError } = await supabase
  .from('documents')
  .insert(payload)
  .select()

    if (dbError) {
      // Delete the uploaded file if database insert fails
      await supabase.storage
        .from('documents')
        .remove([filePath])

      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        document: docData[0],
        message: 'Document uploaded successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Upload handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
