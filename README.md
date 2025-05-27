# DTS Frontend - Defect Tracking System Demo

A modern, responsive React-based frontend for a Defect Tracking System with full demo capabilities.

## 🚀 Demo Mode

This application can run in **Demo Mode** using mock data, perfect for:
- **Customer demonstrations** without exposing real backend systems
- **GitHub Pages deployment** as a static site
- **Offline development** and testing
- **Portfolio showcases** and presentations

### Features in Demo Mode
- ✅ Full UI/UX experience with realistic mock data
- ✅ All CRUD operations (Create, Read, Update, Delete) simulated
- ✅ User authentication simulation
- ✅ File upload simulation
- ✅ Real-time notifications and toasts
- ✅ Responsive design for all devices
- ✅ Dark/Light theme support

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand, React Query
- **Routing**: React Router v7
- **Forms**: React Hook Form with Zod validation
- **Icons**: Heroicons, React Icons
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Development Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd dts-frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

### Demo Mode Configuration
Demo mode is controlled in `src/config/demo.ts`:

```typescript
export const DEMO_MODE = true; // Set to false for production
```

## 🚀 Deployment

### GitHub Pages Deployment
```bash
# Build for GitHub Pages
npm run build:demo

# Deploy to GitHub Pages (requires gh-pages package)
npm run deploy
```

### Manual Deployment
```bash
# Build for production
npm run build

# The dist/ folder contains the built application
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── defects/        # Defect-related components
│   ├── comments/       # Comment system components
│   ├── ui/             # Generic UI components
│   └── layout/         # Layout components
├── pages/              # Page components
│   ├── dashboard/      # Dashboard pages
│   ├── defects/        # Defect management pages
│   ├── admin/          # Admin pages
│   └── auth/           # Authentication pages
├── services/           # API services
│   ├── api.ts          # Real API services
│   ├── mockApi.ts      # Mock API services
│   └── index.ts        # Service selector
├── data/               # Mock data
├── contexts/           # React contexts
├── hooks/              # Custom hooks
└── config/             # Configuration files
```

## 🎯 Key Features

### Defect Management
- Create, edit, and delete defects
- Advanced filtering and search
- Status workflow management
- Priority and severity tracking
- Tag-based organization
- File attachments
- Comment system
- Version history

### User Management
- Role-based access control (Admin, Developer, Tester, Manager)
- User profiles and preferences
- Activity tracking
- Session management

### Dashboard & Analytics
- Real-time defect statistics
- Interactive charts and graphs
- Recent activity feeds
- Quick action buttons

### Admin Features
- User management
- System settings
- Deleted items recovery
- Audit logs

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: User preference with system detection
- **Accessibility**: WCAG compliant with keyboard navigation
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Graceful error messages and recovery
- **Toast Notifications**: Real-time feedback for user actions

## 🔧 Configuration

### Environment Variables
```env
VITE_API_URL=http://localhost:3000  # Backend API URL (production only)
```

### Demo Configuration
Edit `src/config/demo.ts` to customize demo behavior:
- Enable/disable demo banner
- Adjust API delay simulation
- Configure demo user settings
- Control feature availability

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🎯 Demo Use Cases

Perfect for:
- **Sales Demonstrations**: Show potential clients the full system capabilities
- **Portfolio Projects**: Showcase your development skills
- **Training**: Onboard new team members without affecting production data
- **Testing**: Validate UI/UX changes without backend dependencies
- **Presentations**: Demo at conferences or meetings

---

**Note**: This demo version uses simulated data and does not require a backend server. All changes are temporary and reset on page refresh.
