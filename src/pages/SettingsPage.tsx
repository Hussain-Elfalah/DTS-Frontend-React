import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../services/api';
import Loader from '../components/ui/Loader';
import { 
  FiUser, 
  FiShield, 
  // FiBell, 
  FiSettings, 
  FiSave, 
  FiEye,
  FiEyeOff,
  // FiGlobe,
  FiLock,
  FiActivity,
  // FiMail,
  FiEdit2,
  // FiCheck,
  // FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ id, label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-muted text-foreground border border-border'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
    }`}
  >
    <span className="mr-3">{icon}</span>
    {label}
  </button>
);

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    department: '',
    job_title: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setIsEditing(false);
    },
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'preferences', label: 'Preferences', icon: <FiSettings /> },
    // { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'security', label: 'Security', icon: <FiShield /> },
    // { id: 'activity', label: 'Activity', icon: <FiActivity /> },
  ];

  React.useEffect(() => {
    if (userProfile?.data?.user) {
      const userData = userProfile.data.user;
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        department: userData.department || '',
        job_title: userData.job_title || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [userProfile]);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const updateData = {
      username: formData.username,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      department: formData.department,
      job_title: formData.job_title,
    };
    updateProfileMutation.mutate(updateData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Profile Information</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center px-3 py-2 text-sm font-medium text-foreground hover:text-foreground"
        >
          <FiEdit2 className="mr-2 h-4 w-4" />
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:text-muted-foreground bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:text-muted-foreground bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:text-muted-foreground bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:text-muted-foreground bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:text-muted-foreground bg-card text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => handleInputChange('job_title', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:bg-muted disabled:text-muted-foreground bg-card text-foreground"
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <FiSave className="mr-2 h-4 w-4" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">Preferences</h3>

      <div className="space-y-6">
        <div>
          <label className="form-label">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="form-input"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
      </div>
    </div>
  );

  // const renderNotificationsTab = () => (
  //   <div className="space-y-6">
  //     <h3 className="text-lg font-medium text-foreground">Notification Settings</h3>
      
  //     <div className="space-y-4">
  //       {[
  //         { id: 'email_defects', label: 'Email notifications for new defects', description: 'Receive email when defects are assigned to you' },
  //         { id: 'email_comments', label: 'Email notifications for comments', description: 'Receive email when someone comments on your defects' },
  //         { id: 'email_status', label: 'Email notifications for status changes', description: 'Receive email when defect status changes' },
  //         { id: 'browser_notifications', label: 'Browser notifications', description: 'Show browser notifications for important updates' },
  //         { id: 'weekly_summary', label: 'Weekly summary email', description: 'Receive a weekly summary of your defects' }
  //       ].map((notification) => (
  //         <div key={notification.id} className="flex items-start">
  //           <div className="flex items-center h-5">
  //             <input
  //               id={notification.id}
  //               type="checkbox"
  //               defaultChecked={true}
  //               className="h-4 w-4 text-foreground focus:ring-ring border-border rounded"
  //             />
  //           </div>
  //           <div className="ml-3">
  //             <label htmlFor={notification.id} className="text-sm font-medium text-foreground">
  //               {notification.label}
  //             </label>
  //             <p className="text-sm text-muted-foreground">{notification.description}</p>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-foreground">Security Settings</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-4">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4 text-muted-foreground" /> : <FiEye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground"
              />
            </div>

            <button
              type="button"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <FiLock className="mr-2 h-4 w-4" />
              Update Password
            </button>
          </div>
        </div>

        {/* <div className="border-t border-border pt-6">
          <h4 className="text-sm font-medium text-foreground mb-4">Account Security</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <button className="px-3 py-2 text-sm font-medium text-foreground hover:text-foreground">
                Enable
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Login Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified when someone logs into your account</p>
              </div>
              <input
                type="checkbox"
                defaultChecked={true}
                className="h-4 w-4 text-foreground focus:ring-ring border-border rounded"
              />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );

  // const renderActivityTab = () => (
  //   <div className="space-y-6">
  //     <h3 className="text-lg font-medium text-foreground">Recent Activity</h3>
      
  //     <div className="space-y-4">
  //       {[
  //         { action: 'Updated profile information', time: '2 hours ago', icon: <FiUser /> },
  //         { action: 'Changed password', time: '1 day ago', icon: <FiLock /> },
  //         { action: 'Logged in from new device', time: '3 days ago', icon: <FiShield /> },
  //         { action: 'Updated notification preferences', time: '1 week ago', icon: <FiBell /> },
  //         { action: 'Created defect #DEF-001', time: '2 weeks ago', icon: <FiActivity /> }
  //       ].map((activity, index) => (
  //         <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
  //           <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
  //             <span className="text-foreground">{activity.icon}</span>
  //           </div>
  //           <div className="flex-1">
  //             <p className="text-sm font-medium text-foreground">{activity.action}</p>
  //             <p className="text-sm text-muted-foreground">{activity.time}</p>
  //           </div>
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  if (profileLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-60 flex-shrink-0">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.id}
                  id={tab.id}
                  label={tab.label}
                  icon={tab.icon}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'preferences' && renderPreferencesTab()}
            {activeTab === 'security' && renderSecurityTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 