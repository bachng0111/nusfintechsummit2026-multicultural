import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Token type
type MintedToken = {
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

const DATA_DIR = path.join(process.cwd(), 'data');
const ARCHIVE_FILE = path.join(DATA_DIR, 'tokens-archive.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARCHIVE_FILE)) {
    fs.writeFileSync(ARCHIVE_FILE, '[]', 'utf-8');
  }
}

function readArchive(): MintedToken[] {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(ARCHIVE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading archive file:', error);
    return [];
  }
}

// GET /api/tokens/archive - Retrieve all archived tokens (for metadata lookup)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issuanceId = searchParams.get('issuanceId');

    const archive = readArchive();

    if (issuanceId) {
      // Return specific token by issuanceId
      const token = archive.find((t) => t.issuanceId === issuanceId);
      if (!token) {
        return NextResponse.json(
          { error: 'Token not found in archive' },
          { status: 404 }
        );
      }
      return NextResponse.json({ token }, { status: 200 });
    }

    // Return all archived tokens
    return NextResponse.json({ tokens: archive }, { status: 200 });
  } catch (error) {
    console.error('Error fetching archive:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archive' },
      { status: 500 }
    );
  }
}
