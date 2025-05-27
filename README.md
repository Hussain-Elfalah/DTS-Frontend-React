# DTS Frontend - React

This is the frontend application for the Defect Tracking System, built with React and modern web technologies.

## Tech Stack

- **React**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and development server
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd dts-frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Set up environment variables:

Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:3000
```

Replace with your backend API URL.

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
```

This will start the application at `http://localhost:5173`.

### Build for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/      # Reusable UI components
│   ├── auth/        # Authentication components
│   ├── defects/     # Defect-related components
│   ├── comments/    # Comment components
│   ├── attachments/ # Attachment components
│   ├── layout/      # Layout components
│   └── ui/          # Generic UI components
├── context/         # React contexts
├── pages/           # Page components
│   ├── admin/       # Admin pages
│   ├── auth/        # Authentication pages
│   ├── dashboard/   # Dashboard pages
│   ├── defects/     # Defect pages
│   └── user/        # User profile pages
├── services/        # API services
├── App.tsx          # Main app component with routing
└── main.tsx         # Entry point
```

## Features

- User authentication (login, logout)
- Role-based access control (user, admin)
- Dashboard with defect statistics
- Defect management (create, view, edit, delete)
- Defect filtering and searching
- Comment system
- File attachments
- User profile management
- Admin user management

## License

[MIT](LICENSE)
