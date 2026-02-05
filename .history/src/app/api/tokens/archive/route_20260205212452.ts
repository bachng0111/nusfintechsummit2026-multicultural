import { NextRequest, NextResponse } from 'next/server';
import { supabase, fromDBFormat } from '@/lib/supabase';

// GET /api/tokens/archive - Retrieve all tokens (including purchased) for metadata lookup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issuanceId = searchParams.get('issuanceId');

    if (issuanceId) {
      // Return specific token by issuanceId
      const { data, error } = await supabase
        .from('marketplace_tokens')
        .select('*')
        .eq('issuance_id', issuanceId)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Token not found in archive' },
          { status: 404 }
        );
      }

      return NextResponse.json({ token: fromDBFormat(data) }, { status: 200 });
    }

    // Return all tokens (for archive/metadata lookup)
    const { data, error } = await supabase
      .from('marketplace_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch archive' },
        { status: 500 }
      );
    }

    const tokens = (data || []).map(fromDBFormat);
    return NextResponse.json({ tokens }, { status: 200 });
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archive' },
      { status: 500 }
    );
  }
}
