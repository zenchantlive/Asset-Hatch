# Coding Conventions

- **Language**: Strict TypeScript.
- **Components**: Functional React components. Use `export default function` or named exports consistently.
- **Styling**: Tailwind CSS utility classes. Use `cn` (clsx + tailwind-merge) for conditional classes.
- **Imports**: Use `@/` alias for absolute imports from the project root.
- **Structure**:
  - `app/`: App Router pages and layouts.
  - `components/`: UI components.
  - `lib/`: Utility functions.
  - `hooks/`: Custom React hooks.
