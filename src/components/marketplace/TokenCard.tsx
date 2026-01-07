// src/components/TokenCard.tsx
'use client';

import React from 'react';

export interface Token {
  id: string;
  name: string;
  description?: string;
  price?: string;
  vintage?: string;
  project?: string;
  certification?: string;
  amount?: number;
}

interface TokenCardProps {
  token: Token;
  onBuy?: (token: Token) => void; // callback when buy button is clicked
}

export default function TokenCard({ token, onBuy }: TokenCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="mb-4">
        <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
          {token.vintage || 'N/A'}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{token.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{token.description}</p>

      {token.project && (
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Project:</span>
            <span className="font-medium text-gray-900">{token.project}</span>
          </div>
          {token.certification && (
            <div className="flex justify-between">
              <span className="text-gray-600">Certification:</span>
              <span className="font-medium text-gray-900">{token.certification}</span>
            </div>
          )}
          {token.amount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-medium text-gray-900">{token.amount} tCO₂e</span>
            </div>
          )}
        </div>
      )}

      {token.price && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">Price</span>
            <span className="text-2xl font-bold text-green-600">{token.price} XRP</span>
          </div>
          {onBuy && (
            <button
              onClick={() => onBuy(token)}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Buy
            </button>
          )}
        </div>
      )}
    </div>
  );
}
