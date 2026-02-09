'use client';

import { useState } from 'react';

interface AddressInputProps {
  onSubmit: (address: string) => void;
  loading?: boolean;
}

export default function AddressInput({ onSubmit, loading = false }: AddressInputProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const validateAddress = (addr: string): boolean => {
    try {
      // Check length
      if (addr.length !== 44) {
        return false;
      }

      // Check base58 characters only
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      if (!base58Regex.test(addr)) {
        return false;
      }

      // Optional: Additional validation with bs58 if needed
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);

    // Clear error when user starts typing
    if (value.length === 0) {
      setError('');
    } else if (!validateAddress(value)) {
      setError('Please paste a valid Solana address (44 characters, base58 format)');
    } else {
      setError('');
    }
  };

  const handleSubmit = () => {
    if (validateAddress(address)) {
      onSubmit(address);
    } else {
      setError('Please paste a valid Solana address (44 characters, base58 format)');
    }
  };

  const isValid = validateAddress(address);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={handleInputChange}
            placeholder="Paste Solana wallet address (44 characters, base58 format)"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-none text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-blue-400 text-sm">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-none font-medium hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loading...' : 'Run'}
        </button>
      </div>
    </div>
  );
}