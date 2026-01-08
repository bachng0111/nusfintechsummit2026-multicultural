/**
 * Escrow utilities for Carbon Credit Token Exchange
 * 
 * Flow:
 * 1. Buyer clicks "Buy" → Creates PurchaseRequest with their wallet address
 * 2. Issuer sees request → Creates TokenEscrow with crypto-condition
 * 3. Buyer detects escrow → Automatically pays XRP
 * 4. Escrow completes → Buyer receives tokens
 * 
 * Note: Per XLS-85d, issuers cannot directly create escrows. 
 * In production, tokens should first be transferred to a treasury account.
 */

import * as xrpl from 'xrpl';
import crypto from 'crypto';

// Types for the escrow-based purchase system
export interface PurchaseRequest {
  id: string;
  buyerAddress: string;
  tokenIssuanceId: string;
  tokenAmount: number;
  priceXRP: number;
  issuerAddress: string;
  status: 'pending' | 'approved' | 'escrow_created' | 'paid' | 'completed' | 'cancelled';
  createdAt: string;
  escrowSequence?: number;
  escrowCondition?: string;
  escrowFulfillment?: string;
  txHash?: string;
}

export interface EscrowInfo {
  sequence: number;
  owner: string;
  destination: string;
  amount: string;
  condition?: string;
  cancelAfter?: number;
  finishAfter?: number;
}

// Storage keys
const PURCHASE_REQUESTS_KEY = 'purchaseRequests';

/**
 * Generate a crypto-condition and fulfillment pair
 * Uses PREIMAGE-SHA-256 as specified in XLS-85d
 */
export function generateCryptoCondition(): { condition: string; fulfillment: string } {
  // Generate a random 32-byte preimage
  const preimage = crypto.randomBytes(32);
  
  // Create the fulfillment (the preimage itself, encoded)
  // Format: A0 + length + 00 + preimage
  const fulfillmentBytes = Buffer.concat([
    Buffer.from([0xA0, 0x22, 0x80, 0x20]), // Prefix for PREIMAGE-SHA-256 fulfillment
    preimage
  ]);
  const fulfillment = fulfillmentBytes.toString('hex').toUpperCase();
  
  // Create the condition (hash of the preimage)
  // Format: A0 + length + 80 + 20 + hash + 81 + 01 + 20
  const hash = crypto.createHash('sha256').update(preimage).digest();
  const conditionBytes = Buffer.concat([
    Buffer.from([0xA0, 0x25, 0x80, 0x20]), // Prefix
    hash,
    Buffer.from([0x81, 0x01, 0x20]) // Suffix indicating 32-byte preimage
  ]);
  const condition = conditionBytes.toString('hex').toUpperCase();
  
  return { condition, fulfillment };
}

/**
 * Get all purchase requests from localStorage
 */
export function getPurchaseRequests(): PurchaseRequest[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PURCHASE_REQUESTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save purchase requests to localStorage
 */
export function savePurchaseRequests(requests: PurchaseRequest[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PURCHASE_REQUESTS_KEY, JSON.stringify(requests));
}

/**
 * Create a new purchase request (called by buyer)
 */
export function createPurchaseRequest(
  buyerAddress: string,
  tokenIssuanceId: string,
  tokenAmount: number,
  priceXRP: number,
  issuerAddress: string
): PurchaseRequest {
  const request: PurchaseRequest = {
    id: `PR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    buyerAddress,
    tokenIssuanceId,
    tokenAmount,
    priceXRP,
    issuerAddress,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const requests = getPurchaseRequests();
  requests.push(request);
  savePurchaseRequests(requests);

  return request;
}

/**
 * Update a purchase request
 */
export function updatePurchaseRequest(id: string, updates: Partial<PurchaseRequest>): PurchaseRequest | null {
  const requests = getPurchaseRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index === -1) return null;

  requests[index] = { ...requests[index], ...updates };
  savePurchaseRequests(requests);
  return requests[index];
}

/**
 * Get pending requests for an issuer (pending, approved, or escrow_created)
 */
export function getPendingRequestsForIssuer(issuerAddress: string): PurchaseRequest[] {
  return getPurchaseRequests().filter(
    r => r.issuerAddress === issuerAddress && 
    (r.status === 'pending' || r.status === 'approved' || r.status === 'escrow_created')
  );
}

/**
 * Get requests for a buyer
 */
export function getRequestsForBuyer(buyerAddress: string): PurchaseRequest[] {
  return getPurchaseRequests().filter(r => r.buyerAddress === buyerAddress);
}

/**
 * Calculate the CancelAfter time (e.g., 1 hour from now)
 * Returns seconds since Ripple Epoch (Jan 1, 2000)
 */
export function getCancelAfterTime(hoursFromNow: number = 1): number {
  const RIPPLE_EPOCH = 946684800; // Unix timestamp for Jan 1, 2000
  const futureTime = Math.floor(Date.now() / 1000) + (hoursFromNow * 60 * 60);
  return futureTime - RIPPLE_EPOCH;
}

/**
 * Create an XRP escrow transaction (for buyer to pay)
 * This creates an escrow that releases XRP to the issuer when fulfilled
 */
export function createXRPEscrowTransaction(
  buyerAddress: string,
  issuerAddress: string,
  amountXRP: number,
  condition: string,
  cancelAfterHours: number = 1
): xrpl.EscrowCreate {
  return {
    TransactionType: 'EscrowCreate',
    Account: buyerAddress,
    Destination: issuerAddress,
    Amount: xrpl.xrpToDrops(amountXRP),
    Condition: condition,
    CancelAfter: getCancelAfterTime(cancelAfterHours),
  };
}

/**
 * Create an EscrowFinish transaction
 */
export function createEscrowFinishTransaction(
  account: string,
  owner: string,
  offerSequence: number,
  condition?: string,
  fulfillment?: string
): xrpl.EscrowFinish {
  const tx: xrpl.EscrowFinish = {
    TransactionType: 'EscrowFinish',
    Account: account,
    Owner: owner,
    OfferSequence: offerSequence,
  };

  if (condition) tx.Condition = condition;
  if (fulfillment) tx.Fulfillment = fulfillment;

  return tx;
}

/**
 * Query escrows for an account
 */
export async function getAccountEscrows(
  client: xrpl.Client,
  account: string
): Promise<any[]> {
  try {
    const response = await client.request({
      command: 'account_objects',
      account: account,
      type: 'escrow',
    });
    return response.result.account_objects || [];
  } catch (err) {
    console.error('Failed to fetch escrows:', err);
    return [];
  }
}

/**
 * Simple notification system using localStorage
 * In production, this would use WebSockets or a proper notification service
 */
export function notifyIssuer(issuerAddress: string, message: string, data: any): void {
  const notifications = JSON.parse(localStorage.getItem('issuerNotifications') || '[]');
  notifications.push({
    id: Date.now(),
    issuerAddress,
    message,
    data,
    read: false,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem('issuerNotifications', JSON.stringify(notifications));
}

export function getIssuerNotifications(issuerAddress: string): any[] {
  const notifications = JSON.parse(localStorage.getItem('issuerNotifications') || '[]');
  return notifications.filter((n: any) => n.issuerAddress === issuerAddress);
}

export function clearIssuerNotifications(issuerAddress: string): void {
  const notifications = JSON.parse(localStorage.getItem('issuerNotifications') || '[]');
  const filtered = notifications.filter((n: any) => n.issuerAddress !== issuerAddress);
  localStorage.setItem('issuerNotifications', JSON.stringify(filtered));
}
