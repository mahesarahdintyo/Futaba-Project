import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET - Fetch all folders for a specific parent (or root if parent_id is null)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parentIdStr = searchParams.get('parentId')
    const landId = searchParams.get('landId')
    const includeAll = searchParams.get('includeAll') === 'true'
    const searchQuery = searchParams.get('search')?.trim()
    const parentId = parentIdStr ? parseInt(parentIdStr) : null

    const supabase = await createClient()

    let query = supabase.from('folders').select('*')

    if (landId) {
      query = query.eq('land_id', landId)
    }

    if (searchQuery) {
      const escapedSearch = searchQuery.replace(/[%_]/g, '\\$&')
      query = query.ilike('name', `%${escapedSearch}%`)
    }

    if (!includeAll && parentId === null) {
      query = query.is('parent_id', null)
    } else if (!includeAll && parentIdStr) {
      query = query.eq('parent_id', parentId)
    }

    const { data: folders, error } = await query.order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(folders)
  } catch (error) {
    console.error('Folders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new folder
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, parentId } = body

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: newFolder, error } = await supabase
      .from('folders')
      .insert({
        name,
        parent_id: parentId ? parseInt(parentId) : null
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(newFolder[0], { status: 201 })
  } catch (error) {
    console.error('Folders POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a folder
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idStr = searchParams.get('id')

    if (!idStr) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }

    const id = parseInt(idStr)
    const supabase = await createClient()

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Folder deleted successfully' })
  } catch (error) {
    console.error('Folders DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
