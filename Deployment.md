# Deployment Guide

## Infrastructure
- **Platform**: Vercel (Recommended for Next.js)
- **Environment**: Node.js 20+ (Runtime)

## Build Process
1.  **Build Command**: `next build`
2.  **Output**: `.next` directory (standalone mode optional)

## Environment Variables
The following environment variables are required for production:

```env
# Network Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com  # Or specific RPC provider
NEXT_PUBLIC_DERIVERSE_PROGRAM_ID=<Production_Program_ID>

# Feature Flags
NODE_ENV=production
```

## Deployment Steps
1.  Push code to `main` branch.
2.  Vercel automatically triggers a build.
3.  Verify the deployment URL.

## Agentic Helpers
- Use the `vercel-deployment` skill if you need to troubleshoot or configure Vercel deployments.
