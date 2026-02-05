import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// Path to the JSON storage file
const DATA_DIR = path.join(process.cwd(), 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'marketplace-tokens.json');
const ARCHIVE_FILE = path.join(DATA_DIR, 'tokens-archive.json');

// Ensure data directory and files exist
function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, '[]', 'utf-8');
  }
  if (!fs.existsSync(ARCHIVE_FILE)) {
    fs.writeFileSync(ARCHIVE_FILE, '[]', 'utf-8');
  }
}

// Read tokens from file
function readTokens(filePath: string): MintedToken[] {
  ensureDataFiles();
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tokens file:', error);
    return [];
  }
}

// Write tokens to file
function writeTokens(filePath: string, tokens: MintedToken[]) {
  ensureDataFiles();
  fs.writeFileSync(filePath, JSON.stringify(tokens, null, 2), 'utf-8');
}

// GET /api/tokens - Retrieve all marketplace tokens
export async function GET() {
  try {
    const tokens = readTokens(TOKENS_FILE);
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

    // Add to marketplace tokens
    const tokens = readTokens(TOKENS_FILE);
    
    // Check for duplicate
    const exists = tokens.some((t) => t.issuanceId === tokenData.issuanceId);
    if (exists) {
      return NextResponse.json(
        { error: 'Token with this issuanceId already exists' },
        { status: 409 }
      );
    }

    tokens.push(tokenData);
    writeTokens(TOKENS_FILE, tokens);

    // Also add to archive (permanent storage)
    const archive = readTokens(ARCHIVE_FILE);
    archive.push(tokenData);
    writeTokens(ARCHIVE_FILE, archive);

    return NextResponse.json(
      { message: 'Token saved successfully', token: tokenData },
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

// DELETE /api/tokens - Remove a token from marketplace (after purchase)
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

    const tokens = readTokens(TOKENS_FILE);
    const updatedTokens = tokens.filter((t) => t.issuanceId !== issuanceId);

    if (tokens.length === updatedTokens.length) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    writeTokens(TOKENS_FILE, updatedTokens);

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
