// Demo Configuration
// Set this to true to enable demo mode with mock data
// Set this to false to use real API endpoints

export const DEMO_MODE = true;

// Demo configuration settings
export const DEMO_CONFIG = {
  // Show demo banner
  showBanner: true,
  
  // Simulate API delays (in milliseconds)
  apiDelay: 300,
  
  // Demo user info
  demoUser: {
    name: 'John Doe',
    role: 'Admin',
    email: 'john.doe@company.com'
  },
  
  // Features to enable/disable in demo mode
  features: {
    fileUpload: true,
    emailNotifications: false,
    realTimeUpdates: false,
    externalIntegrations: false
  },
  
  // Demo data settings
  data: {
    maxDefects: 50,
    maxUsers: 20,
    maxComments: 100
  }
};

// Helper function to check if we're in demo mode
export const isDemoMode = () => DEMO_MODE;

// Helper function to get demo config
export const getDemoConfig = () => DEMO_CONFIG; 