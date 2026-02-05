import { NextRequest, NextResponse } from 'next/server';
import { supabase, toDBFormat, fromDBFormat } from '@/lib/supabase';

// Token type matching the minted token structure
export type MintedToken = {
  issuanceId: string;
  address: string;
  metadata: {
    projectName: string;
    creditType: string;
    vintage: string;
    certification: string;
    location: string;
    description: string;
    pricePerCredit: string;
  };
  amount: number;
  timestamp: string;
  txHash: string;
  explorerUrl: string;
  ipfsHash: string;
};

// GET /api/tokens - Retrieve all available marketplace tokens
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('marketplace_tokens')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tokens from database' },
        { status: 500 }
      );
    }

    const tokens = (data || []).map(fromDBFormat);
    return NextResponse.json({ tokens }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

// POST /api/tokens - Add a new token
export async function POST(request: NextRequest) {
  try {
    const tokenData: MintedToken = await request.json();

    // Validate required fields
    if (!tokenData.issuanceId || !tokenData.address) {
      return NextResponse.json(
        { error: 'Missing required fields: issuanceId and address are required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('marketplace_tokens')
      .select('issuance_id')
      .eq('issuance_id', tokenData.issuanceId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Token with this issuanceId already exists' },
        { status: 409 }
      );
    }

    // Insert new token
    const dbToken = toDBFormat(tokenData);
    const { data, error } = await supabase
      .from('marketplace_tokens')
      .insert(dbToken)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save token to database' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Token saved successfully', token: fromDBFormat(data) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving token:', error);
    return NextResponse.json(
      { error: 'Failed to save token' },
      { status: 500 }
    );
  }
}

// DELETE /api/tokens - Remove a token from marketplace (mark as unavailable after purchase)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issuanceId = searchParams.get('issuanceId');

    if (!issuanceId) {
      return NextResponse.json(
        { error: 'Missing issuanceId parameter' },
        { status: 400 }
      );
    }

    // Mark token as unavailable (soft delete)
    const { data, error } = await supabase
      .from('marketplace_tokens')
      .update({ is_available: false })
      .eq('issuance_id', issuanceId)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: 'Failed to update token in database' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Token removed from marketplace' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing token:', error);
    return NextResponse.json(
      { error: 'Failed to remove token' },
      { status: 500 }
    );
  }
}
