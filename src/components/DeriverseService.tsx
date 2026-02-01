import { Engine, Instrument, GetClientDataResponse } from '@deriverse/kit';
import { createSolanaRpc } from '@solana/kit';

// Use the exact program ID from the official kit example
const DERIVERSE_DEVNET_PROGRAM_ID = "Drvrseg8AQLP8B96DBGmHRjFGviFNYTkHueY9g3k27Gu";

export interface OrderData {
  orderId: number;
  quantity: number;
  sum: number;
  time: number;
  clientId: number;
}

export interface TradeHistoryResponse {
  spotOrders: OrderData[];
  perpOrders: OrderData[];
}

export class DeriverseService {
  private engine: Engine | null = null;
  private rpc: ReturnType<typeof createSolanaRpc>;
  private static isServiceAvailable = true;

  constructor() {
    // Initialize with Solana devnet RPC (can be changed to mainnet)
    this.rpc = this.createRpc();
  }

  private createRpc() {
    // Using Solana devnet for development
    try {
      const rpc = createSolanaRpc('https://api.devnet.solana.com');
      console.log('RPC created successfully');
      return rpc;
    } catch (error) {
      console.error('Error creating RPC:', error);
      throw new Error('Failed to create RPC connection');
    }
  }

  async initializeEngine(): Promise<void> {
    try {
      console.log('Initializing Deriverse engine...');
      console.log('RPC URL:', 'https://api.devnet.solana.com');
      console.log('Program ID:', DERIVERSE_DEVNET_PROGRAM_ID);
      
      this.engine = new Engine(this.rpc, { 
        programId: DERIVERSE_DEVNET_PROGRAM_ID,
        version: 12, // Use version 12 as per kit-example
        commitment: 'confirmed',
        uiNumbers: true
      });
      
      console.log('Engine created, calling initialize...');
      const initialized = await this.engine.initialize();
      console.log('Engine initialized:', initialized);
      
      if (!initialized) {
        DeriverseService.isServiceAvailable = false;
        throw new Error('Deriverse is not available on devnet at the moment. The protocol may be undergoing maintenance or is temporarily down.');
      }
      
      console.log('Engine initialization successful');
      DeriverseService.isServiceAvailable = true;
    } catch (error) {
      DeriverseService.isServiceAvailable = false;
      console.error('Error initializing Deriverse engine:', error);
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('getMultipleAccountsInfo')) {
          throw new Error('Deriverse protocol not found on devnet. The service might be unavailable or network might be down.');
        } else if (error.message.includes('Initialization failed')) {
          throw new Error('Deriverse DEX is temporarily unavailable. Please try again later or check the status page.');
        } else if (error.message.includes('RPC request failed')) {
          throw new Error('Network connection failed. Please check your internet connection and try again.');
        } else {
          throw new Error(`Deriverse initialization error: ${error.message}`);
        }
      }
      throw new Error('Deriverse DEX service is currently unavailable. Please try again later.');
    }
  }

  async fetchTradesForAddress(address: string): Promise<TradeHistoryResponse> {
    console.log('Fetching trades for address:', address);
    
    // Check if service is available before attempting
    if (!DeriverseService.isDeriverseAvailable()) {
      throw new Error('Deriverse DEX is currently unavailable on devnet. Please try again later.');
    }
    
    if (!this.engine) {
      console.log('Engine not initialized, initializing...');
      await this.initializeEngine();
    }

    try {
      console.log('Setting signer address...');
      // Set client address
      await this.engine!.setSigner(address);
      console.log('Signer set successfully');

      console.log('Getting client data...');
      // Get client data (required first step)
      const clientData = await this.engine!.getClientData();
      console.log('Client data retrieved:', clientData);

      // Initialize results
      const spotOrders: OrderData[] = [];
      const perpOrders: OrderData[] = [];

      // Get available instruments from the engine
      const instruments = Array.from(this.engine!.instruments.values());

      if (instruments.length === 0) {
        console.log('No instruments found');
        return { spotOrders, perpOrders };
      }

      // Try to get orders for each instrument
      for (const instrument of instruments) {
        try {
          const instrumentId = instrument.header.instrId;

          // Get spot orders info for this instrument
          const spotOrdersInfo = await this.engine!.getClientSpotOrdersInfo({
            instrId: instrumentId,
            clientId: clientData.clientId
          });

          // Get actual spot orders if there are any
          if (spotOrdersInfo.bidsCount > 0 || spotOrdersInfo.asksCount > 0) {
            const spotOrdersData = await this.engine!.getClientSpotOrders({
              instrId: instrumentId,
              bidsCount: spotOrdersInfo.bidsCount,
              asksCount: spotOrdersInfo.asksCount,
              bidsEntry: spotOrdersInfo.bidsEntry,
              asksEntry: spotOrdersInfo.asksEntry
            });

            // Process spot orders
            [...spotOrdersData.bids, ...spotOrdersData.asks].forEach(order => {
              spotOrders.push({
                orderId: order.orderId,
                quantity: order.qty,
                sum: order.sum,
                time: order.time,
                clientId: order.clientId
              });
            });
          }

          // Get perpetual orders info for this instrument
          const perpOrdersInfo = await this.engine!.getClientPerpOrdersInfo({
            instrId: instrumentId,
            clientId: clientData.clientId
          });

          // Get actual perpetual orders if there are any
          if (perpOrdersInfo.bidsCount > 0 || perpOrdersInfo.asksCount > 0) {
            const perpOrdersData = await this.engine!.getClientPerpOrders({
              instrId: instrumentId,
              bidsCount: perpOrdersInfo.bidsCount,
              asksCount: perpOrdersInfo.asksCount,
              bidsEntry: perpOrdersInfo.bidsEntry,
              asksEntry: perpOrdersInfo.asksEntry
            });

            // Process perpetual orders
            [...perpOrdersData.bids, ...perpOrdersData.asks].forEach(order => {
              perpOrders.push({
                orderId: order.orderId,
                quantity: order.qty,
                sum: order.sum,
                time: order.time,
                clientId: order.clientId
              });
            });
          }

        } catch (instrumentError) {
          console.log(`No orders found for instrument ${instrument.header.instrId}:`, instrumentError);
          // Continue with other instruments
        }
      }

      return { spotOrders, perpOrders };

    } catch (error) {
      console.error('Error fetching trades:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Client not found') || error.message.includes('No client account')) {
          return { spotOrders: [], perpOrders: [] }; // No trades found
        }
      }
      
      throw new Error('Please check network and try again');
    }
  }

  // Helper method to format time
  static formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  // Helper method to calculate price from sum and quantity
  static calculatePrice(sum: number, quantity: number): number {
    if (quantity === 0) return 0;
    return sum / quantity;
  }

  // Check if Deriverse service is available
  static isDeriverseAvailable(): boolean {
    return DeriverseService.isServiceAvailable;
  }

  // Get service status message
  static getServiceStatusMessage(): string {
    if (DeriverseService.isServiceAvailable) {
      return "Deriverse DEX is operational on devnet";
    } else {
      return "Deriverse DEX is currently unavailable on devnet";
    }
  }
}