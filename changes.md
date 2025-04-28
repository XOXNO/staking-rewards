# Changelog - Custom Modifications

## [DATE] - UI/UX: Unified Wallet Input & Themed Add Button

- The wallet address input is now always visible on the landing page, replacing the previous dialog/button flow.
- The input and Add Wallet button are visually unified, with increased height and a clear, concise placeholder (truncated with ellipsis if too long).
- The Add Wallet button dynamically adapts to the current theme: white background with black text in dark mode, black background with white text in light mode, for maximum clarity and contrast.
- All hover/focus effects are accessible and consistent with the theme, with accentuated borders and subtle backgrounds.
- The overall experience is more direct, modern, and user-friendly for adding a wallet.
- Modified: `src/app/page.tsx`, `src/components/dashboard/WalletInputForm/WalletInputForm.tsx`

## [DATE] - UI/UX: Feature Cards Hover & Icon Update

- Added a subtle hover effect to all cards in the "Key Features" section of the landing page:
  - Cards now slightly elevate (`hover:shadow-lg`), move up (`hover:-translate-y-1`), and scale up (`hover:scale-[1.025]`) on hover.
  - Smooth transition applied (`transition-transform duration-200`).
- Updated each card's icon to use the appropriate Lucide icon for each feature (Wallet, BarChart3, TrendingUp, DatabaseZap, PieChart, CheckCircle).
- Files changed: `src/app/page.tsx`, `changes.md`

_Note: These changes improve the visual clarity and interactivity of the landing page for users._

_Note: Update this file after each custom modification to keep track of all changes from the original branch._ 