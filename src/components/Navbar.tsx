'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/components/buyer/BuyerXRPLProvider';
import { Leaf, Home, ShoppingCart, User, LogOut, Wallet } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { address, balance, isConnected, connectNewWallet, disconnect, isConnecting } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { href: '/buyer/account', label: 'My Account', icon: User, requiresAuth: true },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Leaf className="w-8 h-8 text-green-600 group-hover:text-green-700 transition-colors" />
            <span className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
              CarbonLedger
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              // Skip auth-required links if not connected
              if (link.requiresAuth && !isConnected) return null;

              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Wallet Section */}
          <div className="flex items-center space-x-3">
            {isConnected && address ? (
              <>
                {/* Balance Display */}
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-gray-500">Balance</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {balance ? parseFloat(balance).toFixed(2) : '0'} XRP
                  </div>
                </div>

                {/* Address Badge */}
                <div className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                  {formatAddress(address)}
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={connectNewWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav Links */}
        <div className="md:hidden pb-3 flex space-x-2 overflow-x-auto">
          {navLinks.map((link) => {
            if (link.requiresAuth && !isConnected) return null;

            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm ${
                  isActive
                    ? 'bg-green-100 text-green-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
