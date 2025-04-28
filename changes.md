# Changelog - Custom Modifications

## [DATE] - UI/UX: Unified Wallet Input & Themed Add Button

- The wallet address input is now always visible on the landing page, replacing the previous dialog/button flow.
- The input and Add Wallet button are visually unified, with increased height and a clear, concise placeholder (truncated with ellipsis if too long).
- The Add Wallet button dynamically adapts to the current theme: white background with black text in dark mode, black background with white text in light mode, for maximum clarity and contrast.
- All hover/focus effects are accessible and consistent with the theme, with accentuated borders and subtle backgrounds.
- The overall experience is more direct, modern, and user-friendly for adding a wallet.
- Modified: `src/app/page.tsx`, `src/components/dashboard/WalletInputForm/WalletInputForm.tsx`

_Note: Update this file after each custom modification to keep track of all changes from the original branch._ 