# User-Wallet Relationship Planning

## Overview

This document explores two architectural approaches for managing the relationship between users and wallets in the Deriverse application, with a focus on supporting multi-wallet analytics and user authentication.

---

## Current State

**Database Schema:**
- `user_wallets` table (wallet-centric)
- `trades` table (linked to wallet_address)
- No user accounts or authentication

**User Flow:**
- Manual wallet address entry
- No wallet connection
- No user identity tracking

---

## The Question

**Should we implement:**
1. **Wallet-Centric** (simpler, current approach)
2. **User-Centric** (more complex, better for multi-wallet)

---

## Option 1: Wallet-Centric Architecture

### Database Schema

```sql
user_wallets table:
- wallet_address (TEXT, PRIMARY KEY) ← Wallet IS the identity
- network (TEXT)
- wallet_provider (TEXT)
- connection_method (TEXT)
- last_synced_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

trades table:
- id (TEXT, PRIMARY KEY)
- wallet_address (TEXT, FOREIGN KEY → user_wallets)
- symbol, pnl, fee, etc.
```

### Characteristics

**Identity Model:**
- Each wallet is independent
- No concept of "user account"
- Wallet address = user identity

**Multi-Wallet Support:**
- User can look up multiple wallets
- Each wallet is separate (not linked)
- No cross-wallet analytics

### User Flow

```
1. User enters wallet address A
   → Check cache for wallet A
   → Show trades for wallet A

2. User enters wallet address B
   → Check cache for wallet B
   → Show trades for wallet B

3. No connection between A and B
```

### Pros

✅ **Simple**
- No authentication needed
- No user management
- Already implemented

✅ **Privacy-Focused**
- No user tracking
- No personal data
- Web3-native (wallet = identity)

✅ **Fast to Implement**
- Current schema works
- No migration needed

### Cons

❌ **Limited Multi-Wallet**
- Can't link wallets to one user
- No "my wallets" concept
- Manual switching only

❌ **No Cross-Wallet Analytics**
- Can't see total PnL across all wallets
- Can't compare wallet performance
- No portfolio view

❌ **No User Persistence**
- No "login" concept
- No personalized experience
- No "welcome back" flow

---

## Option 2: User-Centric Architecture

### Database Schema

```sql
users table:
- id (UUID, PRIMARY KEY) ← User identity
- primary_wallet_address (TEXT) ← First connected wallet
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

user_wallets table:
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY → users.id) ← Links to user
- wallet_address (TEXT, UNIQUE) ← One wallet = one user
- is_primary (BOOLEAN) ← Which wallet they logged in with
- network (TEXT)
- wallet_provider (TEXT)
- connection_method (TEXT)
- last_synced_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

trades table:
- id (TEXT, PRIMARY KEY)
- wallet_address (TEXT, FOREIGN KEY → user_wallets)
- symbol, pnl, fee, etc.
```

### Characteristics

**Identity Model:**
- User account exists (UUID)
- One user can have multiple wallets
- Wallets are linked to user

**Multi-Wallet Support:**
- User connects primary wallet (creates account)
- Can add more wallets later
- All wallets linked to one user
- Cross-wallet analytics enabled

### User Flow

```
First Visit:
1. User clicks "Login with Wallet"
2. Connects wallet A (Phantom)
3. System creates:
   - users record (id: uuid-123)
   - user_wallets record (wallet A → user uuid-123)
4. Fetch trades for wallet A
5. Save to cache

Second Visit:
1. User connects wallet A
2. System finds user uuid-123
3. Loads all wallets for user uuid-123
4. Loads cached trades for all wallets
5. Shows dashboard with data

Adding Second Wallet:
1. User (already logged in) clicks "Add Wallet"
2. Connects wallet B (Solflare)
3. System creates:
   - user_wallets record (wallet B → user uuid-123)
4. Fetch trades for wallet B
5. Now user has 2 wallets linked
```

### Pros

✅ **True Multi-Wallet Support**
- One user, multiple wallets
- "My Wallets" dropdown
- Easy switching

✅ **Cross-Wallet Analytics**
- Total PnL across all wallets
- Compare wallet performance
- Portfolio-level insights

✅ **Better UX**
- "Login" concept
- "Welcome back!" experience
- Personalized dashboard
- Auto-load cached data

✅ **Future-Proof**
- Can add email login later
- Can add social login
- Can add user preferences
- Can add notifications

### Cons

❌ **More Complex**
- Need authentication
- Need session management
- More database tables

❌ **Migration Required**
- Need to migrate existing data
- Need to update services
- Need to update UI

❌ **Privacy Considerations**
- Linking wallets to one identity
- User tracking (even if minimal)

---

## Key Differences

| Feature | Option 1 (Wallet-Centric) | Option 2 (User-Centric) |
|---------|---------------------------|-------------------------|
| **Primary Key** | `wallet_address` | `users.id` (UUID) |
| **Identity** | Wallet = User | User account (UUID) |
| **Multi-Wallet** | Manual lookup only | Linked to user account |
| **Cross-Wallet Analytics** | ❌ No | ✅ Yes |
| **Authentication** | ❌ None | ✅ Wallet-based login |
| **Complexity** | Low | Medium |
| **Migration** | None needed | Required |
| **Privacy** | High (no tracking) | Medium (user linking) |

---

## Implementation Details

### Option 2: SQL Migration

```sql
-- Step 1: Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Modify user_wallets table
ALTER TABLE user_wallets ADD COLUMN id UUID DEFAULT gen_random_uuid();
ALTER TABLE user_wallets ADD COLUMN user_id UUID;
ALTER TABLE user_wallets ADD COLUMN is_primary BOOLEAN DEFAULT false;

-- Step 3: Migrate existing data
-- For each existing wallet, create a user
INSERT INTO users (primary_wallet_address)
SELECT wallet_address FROM user_wallets;

-- Link wallets to users
UPDATE user_wallets
SET user_id = users.id,
    is_primary = true
FROM users
WHERE user_wallets.wallet_address = users.primary_wallet_address;

-- Step 4: Add constraints
ALTER TABLE user_wallets ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_wallets ADD CONSTRAINT fk_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_wallets ADD CONSTRAINT unique_wallet 
  UNIQUE (wallet_address);

-- Step 5: Update primary key
ALTER TABLE user_wallets DROP CONSTRAINT user_wallets_pkey;
ALTER TABLE user_wallets ADD PRIMARY KEY (id);
```

### Option 2: TypeScript Service Updates

```typescript
// New UserService
export class SupabaseUserService {
  /**
   * Create user from wallet connection
   */
  async createUser(walletAddress: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({ primary_wallet_address: walletAddress })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*, users(*)')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error?.code === 'PGRST116') return null;
    if (error) throw error;
    
    return data.users;
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string): Promise<UserWallet[]> {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  /**
   * Add wallet to existing user
   */
  async addWallet(userId: string, walletAddress: string): Promise<UserWallet> {
    const { data, error } = await supabase
      .from('user_wallets')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        network: 'devnet',
        wallet_provider: 'Phantom',
        connection_method: 'wallet_connect',
        is_primary: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

### Option 2: Authentication Flow

```typescript
// Login with wallet
const handleWalletLogin = async () => {
  // 1. Connect wallet
  const { publicKey } = await wallet.connect();
  
  // 2. Check if user exists
  const user = await userService.getUserByWallet(publicKey);
  
  if (user) {
    // 3a. Existing user - load data
    const wallets = await userService.getUserWallets(user.id);
    const allAddresses = wallets.map(w => w.wallet_address);
    const trades = await tradeService.getTradesForWallets(allAddresses);
    
    // Set user session
    setCurrentUser(user);
    setUserWallets(wallets);
    setAllTrades(trades);
    
    // Navigate to dashboard
    router.push('/dashboard');
    
  } else {
    // 3b. New user - create account
    const newUser = await userService.createUser(publicKey);
    
    // Create wallet record
    await walletService.saveWallet({
      address: publicKey,
      network: 'devnet',
      provider: 'Phantom',
      method: 'wallet_connect'
    });
    
    // Link wallet to user
    await userService.addWallet(newUser.id, publicKey);
    
    // Fetch trades
    const trades = await fetchTradesFromBlockchain(publicKey);
    await tradeService.saveTrades(publicKey, trades);
    
    // Set user session
    setCurrentUser(newUser);
    
    // Navigate to dashboard
    router.push('/dashboard');
  }
};
```

---

## Recommendation

### For Current Phase (Option 1 - Load Cached Trades)
**Stick with wallet-centric approach:**
- ✅ Implement cache loading (15-20 min)
- ✅ Test with manual entry
- ✅ Verify caching works
- ✅ Quick win

### For Future Phase (Option 2 - User Authentication)
**Migrate to user-centric approach:**
- ✅ Better UX (wallet login)
- ✅ Multi-wallet support
- ✅ Cross-wallet analytics
- ✅ Scalable architecture

---

## Decision Criteria

**Choose Option 1 if:**
- You want simplicity
- Privacy is top priority
- Multi-wallet is not critical
- You want to ship fast

**Choose Option 2 if:**
- You want multi-wallet analytics
- You want "login" experience
- You want portfolio management
- You're building for scale

---

## Migration Path

**If you choose Option 2 later:**

1. **Phase 1:** Implement Option 1 (cache loading)
2. **Phase 2:** Add users table + migration script
3. **Phase 3:** Update services (UserService)
4. **Phase 4:** Add wallet connect UI
5. **Phase 5:** Migrate existing data
6. **Phase 6:** Deprecate manual entry

**Estimated effort:** 3-4 hours total

---

## Questions to Consider

1. **Do you want users to "log in" to the app?**
   - Yes → Option 2
   - No → Option 1

2. **Do you want cross-wallet analytics?**
   - Yes → Option 2
   - No → Option 1

3. **How important is privacy vs convenience?**
   - Privacy → Option 1
   - Convenience → Option 2

4. **How soon do you need this?**
   - ASAP → Option 1 (simpler)
   - Can wait → Option 2 (better UX)

5. **Will users have multiple wallets?**
   - Yes, commonly → Option 2
   - Rarely → Option 1

---

## Next Steps

**Immediate (Today):**
- Decide on architecture (Option 1 or 2)
- If Option 1: Implement cache loading
- If Option 2: Create migration plan

**Short-term (This week):**
- Implement chosen option
- Test thoroughly
- Document decision

**Long-term (Future):**
- If Option 1 chosen: Plan migration to Option 2
- If Option 2 chosen: Add more user features

---

## Summary

**Option 1 (Wallet-Centric):**
- Simple, fast, privacy-focused
- Limited multi-wallet support
- Good for MVP

**Option 2 (User-Centric):**
- Complex, feature-rich, better UX
- Full multi-wallet support
- Good for production

**Recommendation:**
- Start with Option 1 (quick win)
- Migrate to Option 2 when ready (better long-term)

---

*Last Updated: 2026-02-13*
