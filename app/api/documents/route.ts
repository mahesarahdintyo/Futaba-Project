import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch documents by folder, or search across all folders when search is provided
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const folderIdStr = searchParams.get('folderId')
    const folderId = folderIdStr ? parseInt(folderIdStr) : null
    const searchQuery = searchParams.get('search')?.trim()

    const supabase = await createClient()

    let query = supabase
      .from('documents')
      .select(
        `
        id,
        title,
        description,
        file_name,
        file_path,
        file_type,
        file_size,
        created_at,
        folder_id
      `
      )

    if (searchQuery) {
      const escapedSearch = searchQuery.replace(/[%_]/g, '\\$&')
      query = query.or(
        `title.ilike.%${escapedSearch}%,description.ilike.%${escapedSearch}%,file_name.ilike.%${escapedSearch}%`
      )
    } else if (folderId === null) {
      query = query.is('folder_id', null)
    } else {
      query = query.eq('folder_id', folderId)
    }

    const { data: documents, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Transform data to match frontend expectations
    const transformedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      category: 'Lainnya', // default category for compatibility
      type: doc.file_type || 'unknown',
      file: {
        name: doc.file_name,
        path: doc.file_path,
        size: doc.file_size
      }
    }))

    return NextResponse.json(transformedDocuments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new document
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      category_id,
      file_name,
      file_path,
      file_size,
      file_type
    } = body

    if (!title || !file_name || !file_path) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('documents')
      .insert({
        title,
        description,
        category_id: category_id || null,
        file_name,
        file_path,
        file_size,
        file_type
      })
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
