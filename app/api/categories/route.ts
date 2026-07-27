import { createClient } from '@/lib/supabase/server'
import { requireAuthenticatedUser } from '@/lib/services/auth-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { errorResponse } = await requireAuthenticatedUser()
    if (errorResponse) return errorResponse

    const supabase = await createClient()

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
