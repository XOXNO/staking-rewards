# Staking Rewards Dashboard

## Project Overview
A modular dashboard application that allows users to view their staking rewards across multiple providers. Users can paste their wallet address to fetch their entire staking history and view detailed metrics and visualizations.

## Architecture Guidelines

### Folder Structure
```
staking-rewards/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── components/             # Reusable UI components
│   │   │   ├── ui/                 # Base UI components
│   │   │   ├── dashboard/          # Dashboard-specific components
│   │   │   └── charts/             # Visualization components
│   │   ├── api/                    # API module layer
│   │   │   ├── providers/          # Individual staking provider integrations
│   │   │   ├── types/              # API response types
│   │   │   └── services/           # API Service layer
│   │   ├── lib/                    # Utility functions and shared code
│   │   │   ├── utils/              # General utilities
│   │   │   ├── hooks/              # Custom React hooks
│   │   │   └── constants/          # Application constants
│   │   ├── types/                  # Global TypeScript type definitions
│   │   └── styles/                 # Global styles and theme configuration
│   └── public/                     # Static assets
```

### Coding Standards

#### Type Safety
- All components, functions, and variables must be properly typed with TypeScript
- Avoid using `any` type - use proper type definitions or `unknown` when necessary
- Create dedicated type files for API responses, component props, and state

#### Component Structure
- Components should be modular and follow single responsibility principle
- Use named exports for all components
- Organize related components in dedicated folders
- Follow atomic design principles where appropriate

#### API Layer
- Keep API calls isolated in the dedicated API module
- Create service abstractions for each provider
- Implement proper error handling for all API calls
- Cache results where appropriate to minimize redundant calls

#### Styling Guidelines
- Use Tailwind CSS for styling with consistent naming conventions
- Create a centralized theme configuration in the Tailwind config
- Use CSS variables for key theme elements (colors, spacing, etc.)
- Ensure responsive design for all components

#### State Management
- Use React hooks for local state management
- For more complex state, consider React Context or a dedicated state management library
- Maintain clear separation between UI state and data state

#### Comments and Documentation
- Include JSDoc comments for all significant functions and components
- Document complex logic with clear inline comments
- Keep comments up-to-date with code changes
- Document API integrations thoroughly

#### Testing
- Write unit tests for utility functions
- Create component tests for complex UI components
- Test API integration layer with mocks

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
