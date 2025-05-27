# DTS Demo Setup Guide

## 🎯 Overview

This guide explains how to set up and deploy the **Defect Tracking System (DTS)** as a demo application using mock data. The demo version provides a complete UI/UX experience without requiring a backend server.

## ✅ What's Been Implemented

### 1. Mock Data System
- **Location**: `src/data/mockData.ts`
- **Contains**: Realistic sample data for users, defects, comments, solutions, and projects
- **Features**: 
  - 5 sample users with different roles (Admin, Developer, Tester, Manager)
  - 8 sample defects with various statuses and priorities
  - Comments and solutions linked to defects
  - Proper relationships between entities

### 2. Mock API Services
- **Location**: `src/services/mockApi.ts` and `src/services/mockSolutionApi.ts`
- **Functionality**: Complete API simulation with realistic delays
- **Features**:
  - All CRUD operations (Create, Read, Update, Delete)
  - File upload simulation
  - Authentication simulation
  - Error handling and success notifications
  - Pagination and filtering

### 3. Service Selector
- **Location**: `src/services/index.ts`
- **Purpose**: Automatically switches between real and mock APIs
- **Configuration**: Controlled by `src/config/demo.ts`

### 4. Demo Configuration
- **Location**: `src/config/demo.ts`
- **Settings**:
  ```typescript
  export const DEMO_MODE = true; // Toggle demo mode
  export const DEMO_CONFIG = {
    showBanner: true,        // Show demo banner
    apiDelay: 300,          // Simulate API delays
    features: { ... },      // Feature toggles
    data: { ... }          // Data limits
  };
  ```

### 5. Demo Banner
- **Location**: `src/components/DemoBanner.tsx`
- **Purpose**: Clearly indicates demo mode to users
- **Styling**: Attractive gradient banner with information icon

### 6. GitHub Pages Deployment
- **Workflow**: `.github/workflows/deploy.yml`
- **Scripts**: `npm run build:demo` and `npm run deploy`
- **Automation**: Automatic deployment on push to main branch

## 🚀 Quick Start

### 1. Development
```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

### 2. Build for Production
```bash
# Regular build
npm run build

# Build for GitHub Pages (with base path)
npm run build:demo
```

### 3. Deploy to GitHub Pages
```bash
# Manual deployment
npm run deploy

# Or push to main branch for automatic deployment
git push origin main
```

## 🔧 Configuration Options

### Toggle Demo Mode
Edit `src/config/demo.ts`:
```typescript
export const DEMO_MODE = false; // Disable demo mode for production
```

### Customize Demo Banner
Edit `src/components/DemoBanner.tsx` to change the banner appearance or message.

### Modify Mock Data
Edit `src/data/mockData.ts` to:
- Add more sample users, defects, or comments
- Change user roles and permissions
- Modify defect statuses and priorities
- Update sample data to match your use case

### Adjust API Delays
Edit `src/config/demo.ts`:
```typescript
export const DEMO_CONFIG = {
  apiDelay: 500, // Increase for slower simulation
  // ...
};
```

## 📁 Key Files Modified

### Core Files
- `src/App.tsx` - Added demo banner and service imports
- `src/services/index.ts` - Service selector for API switching
- `src/config/demo.ts` - Demo configuration
- `package.json` - Added deployment scripts

### Mock Implementation
- `src/data/mockData.ts` - Sample data and helper functions
- `src/services/mockApi.ts` - Mock API for defects, users, comments
- `src/services/mockSolutionApi.ts` - Mock API for solutions
- `src/components/DemoBanner.tsx` - Demo indicator banner

### Deployment
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `README.md` - Updated documentation

## 🎨 Demo Features

### Fully Functional UI
- ✅ Dashboard with statistics and charts
- ✅ Defect management (CRUD operations)
- ✅ User management and profiles
- ✅ Comment system
- ✅ File upload simulation
- ✅ Advanced filtering and search
- ✅ Responsive design (mobile-friendly)
- ✅ Dark/Light theme support
- ✅ Toast notifications
- ✅ Loading states and error handling

### Simulated Backend Operations
- ✅ User authentication
- ✅ Role-based permissions
- ✅ Data persistence (session-based)
- ✅ File attachments
- ✅ Workflow actions
- ✅ Version history
- ✅ Admin functions

## 🌐 Deployment Options

### 1. GitHub Pages (Recommended)
- **URL**: `https://yourusername.github.io/repository-name`
- **Setup**: Update `homepage` in `package.json`
- **Deployment**: Automatic via GitHub Actions

### 2. Netlify
- **Setup**: Connect GitHub repository
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### 3. Vercel
- **Setup**: Import GitHub repository
- **Framework**: Vite
- **Build Command**: `npm run build`

### 4. Static Hosting
- **Build**: `npm run build`
- **Upload**: Contents of `dist/` folder

## 🔍 Testing the Demo

### 1. Login
- **Username**: Any username (demo mode accepts any credentials)
- **Password**: Any password
- **Default User**: John Doe (Admin role)

### 2. Navigation
- **Dashboard**: View statistics and recent activity
- **Defects**: Browse, create, edit, and manage defects
- **Users**: Admin can manage user accounts
- **Profile**: Update user preferences and settings

### 3. Features to Test
- Create a new defect
- Add comments to existing defects
- Upload file attachments (simulated)
- Change defect status using workflow actions
- Filter and search defects
- Switch between light/dark themes
- Test responsive design on mobile

## 🎯 Use Cases

### Sales Demonstrations
- Show complete system functionality
- No backend setup required
- Professional appearance with demo banner
- All features work seamlessly

### Portfolio Projects
- Showcase React/TypeScript skills
- Demonstrate modern UI/UX design
- Show complex state management
- Highlight responsive design

### Training and Onboarding
- Safe environment for learning
- No risk of affecting production data
- Complete feature set available
- Realistic user experience

## 🔧 Troubleshooting

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Deployment Issues
```bash
# Check GitHub Pages settings
# Ensure Actions have write permissions
# Verify branch name in workflow file
```

### Demo Mode Not Working
```bash
# Check src/config/demo.ts
# Verify DEMO_MODE is set to true
# Check browser console for errors
```

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure demo mode is properly configured
4. Review the GitHub Actions logs for deployment issues

---

**Note**: This demo version is designed to showcase the complete DTS system functionality without requiring a backend server. All data is simulated and resets on page refresh. 