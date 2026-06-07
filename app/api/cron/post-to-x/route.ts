import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: pending } = await supabaseAdmin
    .from('x_posts')
    .select('*')
    .eq('status', 'pending')
    .limit(5)

  return NextResponse.json({ pending: pending?.length ?? 0, note: 'X API wiring added in Task 11' })
}
