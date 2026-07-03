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

    const folderIds = (folders ?? []).map((folder) => folder.id)

    if (folderIds.length === 0) {
      return NextResponse.json(folders ?? [])
    }

    let childFolderQuery = supabase
      .from('folders')
      .select('parent_id')
      .in('parent_id', folderIds)

    let childDocumentQuery = supabase
      .from('documents')
      .select('folder_id')
      .in('folder_id', folderIds)

    if (landId) {
      childFolderQuery = childFolderQuery.eq('land_id', landId)
      childDocumentQuery = childDocumentQuery.eq('land_id', landId)
    }

    const [
      { data: childFolders, error: childFoldersError },
      { data: childDocuments, error: childDocumentsError },
    ] = await Promise.all([childFolderQuery, childDocumentQuery])

    if (childFoldersError || childDocumentsError) {
      return NextResponse.json(
        { error: childFoldersError?.message ?? childDocumentsError?.message },
        { status: 500 }
      )
    }

    const contentCountByFolderId = new Map<number, number>()

    for (const childFolder of childFolders ?? []) {
      if (typeof childFolder.parent_id !== 'number') continue
      contentCountByFolderId.set(
        childFolder.parent_id,
        (contentCountByFolderId.get(childFolder.parent_id) ?? 0) + 1
      )
    }

    for (const childDocument of childDocuments ?? []) {
      if (typeof childDocument.folder_id !== 'number') continue
      contentCountByFolderId.set(
        childDocument.folder_id,
        (contentCountByFolderId.get(childDocument.folder_id) ?? 0) + 1
      )
    }

    const foldersWithCounts = folders.map((folder) => ({
      ...folder,
      item_count: contentCountByFolderId.get(folder.id) ?? 0,
    }))

    return NextResponse.json(foldersWithCounts)
  } catch (error) {
    console.error('Folders GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new folder
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      name,
      parentId,
      landId
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: newFolder, error } = await supabase
      .from('folders')
      .insert({
        name,
        parent_id: parentId ? parseInt(parentId) : null,
        land_id: landId
      })
      .select()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newFolder[0], { status: 201 })
  } catch (error) {
    console.error('Folders POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a folder
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idStr = searchParams.get('id')

    if (!idStr) {
      return NextResponse.json(
        { error: 'Folder ID is required' },
        { status: 400 }
      )
    }

    const id = parseInt(idStr)
    const supabase = await createClient()

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Folder deleted successfully'
    })
  } catch (error) {
    console.error('Folders DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
