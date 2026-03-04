# Founder Features & Vision

## Product Vision
**Deriverse** is a specialized analytics and trade lookup platform designed for the Deriverse ecosystem on Solana. It aims to provide transparency and easy access to trading activities.

## Core Features
1.  **Trade Lookup**:
    - Users can input a wallet address to retrieve their trading history.
    - Differentiation between Spot and Perpetual orders.
    - Detailed breakdown: Order ID, Quantity, Sum, Time, Client ID.

2.  **User Experience (UX)**:
    - **Premium Aesthetics**: High-end, dark-mode focused UI.
    - **Visual Feedback**: Integration of `Agentation` for direct visual annotation and feedback during development.
    - **Tabbed Navigation**: Simple intuitive switching between Spot and Perp views.

3.  **Target Audience**:
    - Traders using the Deriverse protocol.
    - Developers debugging Deriverse interactions.

## Changelog

### Order Simulator — UI & Interaction Polish (2026-03-04)

Improvements to the **Spot Concepts → Order Simulator** page based on user feedback:

- **Drag-to-pan diagram**: The Order Flow diagram now supports click-and-drag panning. The cursor changes to a grab hand on hover and a grabbing hand while dragging, replacing the need for scrollbars when zoomed in.
- **Diagram padding**: Increased canvas padding in the Order Flow SVG (PAD: 32 → 56) so node boxes and edge labels have more breathing room on the left and right edges.
- **WS status tooltip**: Hovering over the LIVE / REST / MANUAL price-source badge in the token selector bar now shows a tooltip explaining the active price source:
  - *LIVE* — Connected to Binance WebSocket; real-time prices.
  - *REST* — WebSocket unavailable; using CoinGecko REST API, polling every 4 s.
  - *MANUAL* — Prices overridden via the Set Manual Prices panel.
- **Renamed "Control" button**: The control panel toggle in the token bar is now labelled **"Set Manual Prices"** for clarity.

---

## Roadmap (Potential)
- **Visual Analytics**: Charts and graphs for PnL analysis.
- **Real-time Updates**: WebSocket subscriptions for live order tracking.
- **Admin Features**: Restricted areas for protocol management (as seen in prior task history).
