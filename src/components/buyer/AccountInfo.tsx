import React from 'react';

interface AccountInfoProps {
  ownedCount: number;
  retiredCount: number;
  totalVolume: number;
  rlusdBalance?: number; // optional for now, add when wallet connected
}

const AccountInfo: React.FC<AccountInfoProps> = ({
  ownedCount,
  retiredCount,
  totalVolume,
  rlusdBalance = 0,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 flex flex-col md:flex-row gap-6 justify-around">
      <div className="text-center">
        <p className="text-gray-500">Owned Tokens</p>
        <p className="text-2xl font-bold">{ownedCount}</p>
      </div>
      <div className="text-center">
        <p className="text-gray-500">Retired Tokens</p>
        <p className="text-2xl font-bold">{retiredCount}</p>
      </div>
      <div className="text-center">
        <p className="text-gray-500">Total CO₂ Offset (tons)</p>
        <p className="text-2xl font-bold">{totalVolume}</p>
      </div>
      <div className="text-center">
        <p className="text-gray-500">RLUSD Balance</p>
        <p className="text-2xl font-bold">{rlusdBalance}</p>
      </div>
    </div>
  );
};

export default AccountInfo;
