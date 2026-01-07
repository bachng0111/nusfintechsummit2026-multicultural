// src/components/TokenCard.tsx
'use client';

import React from 'react';

interface TokenCardProps {
  token: any;
  onPurchase?: (token: any) => void;
  onBurn?: (token: any) => void;
  showBurn?: boolean;
  showRetired?: boolean;
}

export default function TokenCard({
  token,
  onPurchase,
  onBurn,
  showBurn = false,
  showRetired = false,
}: TokenCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 rounded-lg ${
            showRetired ? 'bg-green-600' : 'bg-green-100'
          } text-center`}
        >
          <span className="text-xl">
            {showRetired ? '🏆' : showBurn ? '🌿' : '🌱'}
          </span>
        </div>

        {showRetired ? (
          <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
            RETIRED
          </span>
        ) : showBurn ? (
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Active
          </span>
        ) : (
          <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {token.vintage}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-2">{token.name}</h3>
      <p className="text-sm text-gray-600 mb-4">{token.description}</p>

      {token.project && (
        <div className="space-y-2 mb-4 text-sm">
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
          {onPurchase && (
            <button
              onClick={() => onPurchase(token)}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Purchase Credit
            </button>
          )}
          {showBurn && onBurn && (
            <button
              onClick={() => onBurn(token)}
              className="w-full mt-2 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              🔥 Retire & Burn
            </button>
          )}
        </div>
      )}
    </div>
  );
}
