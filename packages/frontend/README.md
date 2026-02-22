# ChainBounty Frontend

This is the Next.js frontend for ChainBounty.

## 🚀 Quick Start

1.  **Run Development Server:**

    ```bash
    npm run dev
    ```

    (Run this from the root of the project or inside `packages/frontend`)

2.  **Build for Production:**
    ```bash
    npm run build
    ```

## 📂 Project Structure

- `app/`: Main application pages and routing.
  - `page.tsx`: **Landing Page** (Home).
  - `globals.css`: Global styles (Tailwind imports).
  - `layout.tsx`: Main layout wrapper (fonts, metadata).
- `components/`: Reusable UI components.
  - `Hero.tsx`: **Hero Section** (The main top banner).
  - `Navbar.tsx`: Top navigation bar.
  - `Footer.tsx`: Page footer.
  - `BountyCard.tsx`: Card component for displaying bounties.

## 🛠️ How to Edit

### 1. Changing the Hero Text

Open `components/Hero.tsx`. You will see the text "SHIP WORK. GET PAID. CROSS-CHAIN." inside the `<h1>` tag. Edit the text directly there.

### 2. Adding a New Page

Create a new folder in `app/`, e.g., `app/about/`.
Create a `page.tsx` file inside it:

```tsx
export default function AboutPage() {
  return (
    <main>
      <h1>About Us</h1>
    </main>
  );
}
```

It will be accessible at `/about`.

### 3. Styling

This project uses **Tailwind CSS**. You can add classes directly to elements (e.g., `className="text-red-500 font-bold"`).
Global styles are in `app/globals.css`.

## ⚠️ Common Issues

- **Hydration Error:** If you see this, it usually means the server HTML and client HTML didn't match. Ensure you aren't using random values (like `Math.random()`) directly in the render without `useEffect`.
- **Black Screen:** Check the browser console (F12) for errors. Often caused by infinite loops or heavy animations blocking the main thread.