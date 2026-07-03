import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface DisplayDocument {
  id: string
  title: string
  description?: string
  category?: string
  type: string
  file: {
    name: string
    path: string
    size?: number
  }
  targetTime?: string | null
  updatedAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var futabaDisplayDocument: DisplayDocument | null | undefined
}

async function getDocumentTargetTime(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select('target_time')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Display target time lookup error:', error)
    return undefined
  }

  return data?.target_time ?? null
}

function isDisplayDocument(value: unknown): value is Omit<DisplayDocument, 'updatedAt'> {
  if (!value || typeof value !== 'object') return false

  const document = value as Partial<DisplayDocument>

  return (
    typeof document.id === 'string' &&
    typeof document.title === 'string' &&
    typeof document.type === 'string' &&
    typeof document.file?.name === 'string' &&
    typeof document.file?.path === 'string' &&
    (typeof document.description === 'undefined' || typeof document.description === 'string') &&
    (typeof document.category === 'undefined' || typeof document.category === 'string') &&
    (
      typeof document.targetTime === 'undefined' ||
      document.targetTime === null ||
      typeof document.targetTime === 'string'
    ) &&
    (typeof document.file.size === 'undefined' || typeof document.file.size === 'number')
  )
}

export async function GET() {
  const document = globalThis.futabaDisplayDocument ?? null

  if (document) {
    const targetTime = await getDocumentTargetTime(document.id)
    if (typeof targetTime !== 'undefined') {
      globalThis.futabaDisplayDocument = {
        ...document,
        targetTime,
      }
    }
  }

  return NextResponse.json({
    document: globalThis.futabaDisplayDocument ?? null,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!isDisplayDocument(body)) {
      return NextResponse.json(
        { error: 'Invalid display document payload' },
        { status: 400 }
      )
    }

    const targetTime = body.targetTime ?? await getDocumentTargetTime(body.id)

    const nextDocument: DisplayDocument = {
      id: body.id,
      title: body.title,
      description: body.description,
      category: body.category,
      type: body.type,
      file: {
        name: body.file.name,
        path: body.file.path,
        size: body.file.size,
      },
      targetTime,
      updatedAt: Date.now(),
    }

    globalThis.futabaDisplayDocument = nextDocument

    return NextResponse.json({
      success: true,
      document: nextDocument,
    })
  } catch (error) {
    console.error('Display document handler error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
