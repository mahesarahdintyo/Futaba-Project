import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const targetTime = body.target_time
    const hiddenFromOperator = body.hidden_from_operator

    if (
      typeof targetTime !== 'undefined' &&
      targetTime !== null &&
      typeof targetTime !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Target time must be a string or null' },
        { status: 400 }
      )
    }

    if (
      typeof hiddenFromOperator !== 'undefined' &&
      typeof hiddenFromOperator !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Hidden from operator must be a boolean' },
        { status: 400 }
      )
    }

    const updateFields: {
      target_time?: string | null
      hidden_from_operator?: boolean
    } = {}

    if (typeof targetTime !== 'undefined') {
      updateFields.target_time = targetTime || null
    }

    if (typeof hiddenFromOperator !== 'undefined') {
      updateFields.hidden_from_operator = hiddenFromOperator
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: 'No document fields to update' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('documents')
      .update(updateFields)
      .eq('id', id)
      .select('id, target_time, hidden_from_operator')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      document: {
        id: data.id,
        targetTime: data.target_time,
        hiddenFromOperator: data.hidden_from_operator,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get document to find file path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete file from storage
    if (document.file_path) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue even if storage delete fails
      }
    }

    // Delete document record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
