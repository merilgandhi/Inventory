
<div align="center">
  <h1>📦 Inventory Management Dashboard</h1>
  <p>Modern, modular inventory and order management system built with React, TypeScript, and Vite.</p>
  <img src="public/logo.png" alt="Inventory Dashboard" width="180"/>
</div>

---

## 🚀 Overview

This project is a feature-rich inventory and order management dashboard. It provides authentication, product and order flows, and a clean, modular architecture for easy extension and maintenance.

**Tech Stack:**
- React 18 + TypeScript
- Vite (blazing fast dev/build)
- React Context for global state
- CSS Modules for styling
- Modular file structure for scalability

---

## 🗂️ Project Structure

```
src/
  components/      # Reusable UI components (Pagination, Sidebar, DeleteConfirmation, etc.)
  context/         # React Contexts (AuthContext)
  layouts/         # Layouts (DashboardLayout)
  Pages/           # Route-level pages (Orders, Products, Auth, Dashboard)
  Services/        # API logic (order.service.ts, clientServices.ts)
  utils/           # Data transformation and calculations
  hooks/           # Custom React hooks
  routes/          # Route guards (ProtectedRoute)
  types/           # TypeScript types
  Global/          # Global UI (Header, Footer)
```

---

## 🏗️ Key Features

- **Authentication:** Login flow using React Context ([src/context/AuthContext.tsx](src/context/AuthContext.tsx), [src/Pages/Auth/LogIn.tsx](src/Pages/Auth/LogIn.tsx))
- **Order Management:** Create, list, and manage orders ([src/Pages/Orders/CreateOrders.tsx](src/Pages/Orders/CreateOrders.tsx), [src/Pages/Orders/OrdersList.tsx](src/Pages/Orders/OrdersList.tsx))
- **Product Management:** Product listing and variations ([src/Pages/Products/ProductList.tsx](src/Pages/Products/ProductList.tsx), [src/Pages/Products/Variations.tsx](src/Pages/Products/Variations.tsx))
- **Reusable Components:** Pagination, confirmation dialogs, sidebar, etc.
- **API Integration:** All backend calls via service files ([src/Services/order.service.ts](src/Services/order.service.ts))
- **Protected Routes:** Route guards for authenticated access ([src/routes/ProtectedRoute.tsx](src/routes/ProtectedRoute.tsx))

---

## ⚡ Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start development server:**
   ```bash
   npm run dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```
4. **Lint code:**
   ```bash
   npm run lint
   ```
5. **Type check:**
   ```bash
   tsc --noEmit
   ```

---

## 🧩 Example Workflows

- **Order Creation:** See [src/Pages/Orders/CreateOrders.tsx](src/Pages/Orders/CreateOrders.tsx) for form, service, and context usage.
- **Sidebar/Layout:** [src/components/Sidebar.tsx](src/components/Sidebar.tsx), [src/layouts/DashboardLayout.tsx](src/layouts/DashboardLayout.tsx)
- **Global State:** [src/context/AuthContext.tsx](src/context/AuthContext.tsx)

---

## 📝 Conventions & Patterns

- **File Naming:** PascalCase for components/pages, camelCase for hooks/utils
- **Component Style:** Function components with hooks
- **API Calls:** Use service files, never direct fetch/axios in components
- **State:** Context for global, hooks/local for component-specific
- **Styling:** CSS modules and global styles ([src/App.css](src/App.css), [src/index.css](src/index.css))

---

## 📚 Further Reading

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

---

<div align="center">
  <b>Made with ❤️ for modern inventory management</b>
</div>
