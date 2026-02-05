import { NextRequest, NextResponse } from 'next/server';
import { supabase, retirementToDBFormat, retirementFromDBFormat, RetirementCertificate } from '@/lib/supabase';

// GET /api/retirements - Retrieve retirement certificates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerAddress = searchParams.get('ownerAddress');
    const mptIssuanceId = searchParams.get('mptIssuanceId');

    let query = supabase
      .from('retirement_certificates')
      .select('*')
      .order('retired_at', { ascending: false });

    // Filter by owner if provided
    if (ownerAddress) {
      query = query.eq('owner_address', ownerAddress);
    }

    // Filter by token if provided
    if (mptIssuanceId) {
      query = query.eq('mpt_issuance_id', mptIssuanceId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch retirement certificates' },
        { status: 500 }
      );
    }

    const certificates = (data || []).map(retirementFromDBFormat);
    return NextResponse.json({ certificates }, { status: 200 });
  } catch (error) {
    console.error('Error fetching retirements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch retirement certificates' },
      { status: 500 }
    );
  }
}

// POST /api/retirements - Create a new retirement certificate
export async function POST(request: NextRequest) {
  try {
    const certData: RetirementCertificate = await request.json();

    // Validate required fields
    if (!certData.certificateId || !certData.mptIssuanceId || !certData.txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: certificateId, mptIssuanceId, and txHash are required' },
        { status: 400 }
      );
    }

    // Check for duplicate certificate
    const { data: existing } = await supabase
      .from('retirement_certificates')
      .select('certificate_id')
      .eq('certificate_id', certData.certificateId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Certificate with this ID already exists' },
        { status: 409 }
      );
    }

    // Insert new retirement certificate
    const dbCert = retirementToDBFormat(certData);
    const { data, error } = await supabase
      .from('retirement_certificates')
      .insert(dbCert)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save retirement certificate' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Retirement certificate saved successfully', certificate: retirementFromDBFormat(data) },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving retirement:', error);
    return NextResponse.json(
      { error: 'Failed to save retirement certificate' },
      { status: 500 }
    );
  }
}
