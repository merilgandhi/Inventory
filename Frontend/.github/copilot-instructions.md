# Copilot Instructions for Inventory Frontend

## Project Overview
- **Stack:** React + TypeScript + Vite
- **Structure:** Modular, with `src/components`, `src/Pages`, `src/layouts`, `src/context`, and `src/Services`.
- **Purpose:** Inventory/order management dashboard with authentication, product, and order flows.

## Key Architectural Patterns
- **Pages:** Route-level components in `src/Pages` (e.g., `Orders/OrdersList.tsx`, `Products/ProductList.tsx`).
- **Components:** Reusable UI in `src/components` (e.g., `Pagination.tsx`, `DeleteConfirmation.tsx`).
- **Layouts:** Shared UI structure in `src/layouts` (e.g., `DashboardLayout.tsx`).
- **Context:** App-wide state (e.g., `AuthContext.tsx` for authentication).
- **Services:** API logic in `src/Services` (e.g., `order.service.ts`, `clientServices.ts`).
- **Utils:** Data transformation and calculations in `src/utils` (e.g., `order.builder.ts`).

## Data Flow & Integration
- **API Calls:** Centralized in `src/Services`. Use these for all backend communication.
- **Context:** Use React Context for global state (auth, user info).
- **Props:** Pass data between components via props, especially for forms and lists.

## Developer Workflows
- **Start Dev Server:** `npm run dev` (uses Vite)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (ESLint, see `eslint.config.js`)
- **Type Check:** `tsc --noEmit` (uses `tsconfig.app.json`)
- **No built-in tests** (add tests in `src/__tests__` if needed)

## Project Conventions
- **File Naming:** PascalCase for components/pages, camelCase for hooks/utils.
- **Component Structure:** Prefer function components with hooks.
- **API Integration:** Use service files, avoid direct fetch/axios in components.
- **State Management:** Use Context for global, hooks/local state for component-specific.
- **Styling:** CSS modules and global styles in `App.css`, `index.css`.

## Examples
- **Order creation:** See `src/Pages/Orders/CreateOrders.tsx` (uses service, form, and context).
- **Sidebar/Layout:** See `src/components/Sidebar.tsx` and `src/layouts/DashboardLayout.tsx`.
- **Auth:** See `src/context/AuthContext.tsx` and `src/Pages/Auth/LogIn.tsx`.

## External Dependencies
- **Vite** for build/dev
- **ESLint** for linting
- **React Context** for state

---
For more, see [README.md](../../Frontend/README.md) and service/context/utils directories for patterns.
