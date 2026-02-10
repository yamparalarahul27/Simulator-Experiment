import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Connection } from "@solana/web3.js";
import { RPC_HTTP } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get Solana RPC Connection
export function getRpcConnection(): Connection {
  return new Connection(RPC_HTTP, 'confirmed');
}

// Format timestamp to readable date/time
export function formatTimestamp(timestamp: number): string {
  // Convert seconds to milliseconds if needed (assuming input is potentially seconds)
  // Detailed logic: if timestamp is small (e.g. < 1e11), it's likely seconds.
  const date = new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

// Format number as USD currency
export function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format number as percentage
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
