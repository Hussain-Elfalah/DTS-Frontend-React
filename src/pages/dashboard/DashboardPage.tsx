import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { defectApi } from '../../services/api';
import { FiActivity, FiClock, FiCheckCircle, FiAlertTriangle, FiUsers, FiTrendingUp, FiCalendar, FiPlus, FiAlertCircle, FiXCircle, FiPauseCircle } from 'react-icons/fi';
import Loader from '../../components/ui/Loader';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// Type definitions
interface TimelineData {
  date: string;
  count: number;
}

interface StatusData {
  name: string;
  value: number;
}

interface AssigneeData {
  name: string;
  count: number;
}

interface CategoryData {
  name: string;
  count: number;
}

interface SeverityData {
  name: string;
  value: number;
}

interface StatsState {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  highPriority: number;
  byAssignee: AssigneeData[];
  byCategory: CategoryData[];
  byStatus: StatusData[];
  bySeverity: SeverityData[];
  timeline: TimelineData[];
}

// Colors for charts
const COLORS = {
  open: '#b42318',
  in_progress: '#F59E0B', 
  resolved: '#0a0a0a',
  closed: '#10B981',
  critical: '#b42318',
  high: '#F59E0B',
  medium: '#0a0a0a',
  low: '#10B981'
};

// Card components
const StatCard = ({ 
  title, 
  value, 
  icon, 
  color,
  trend
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="bg-card rounded-lg shadow p-6 hover:shadow-sm transition-shadow border border-border">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${color} text-white`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      {trend && (
        <div className={`flex items-center text-sm font-medium ${
          trend.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          <FiTrendingUp className={`w-4 h-4 mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
          {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  </div>
);

const SimpleCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
  <div className="bg-card rounded-lg shadow p-5 border border-border">
    <h3 className="text-muted-foreground text-sm">{title}</h3>
    <p className={`text-2xl font-semibold mt-2 ${color}`}>{value}</p>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState<StatsState>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    highPriority: 0,
    byAssignee: [],
    byCategory: [],
    byStatus: [],
    bySeverity: [],
    timeline: [],
  });

  // Fetch defects data
  const { data: defectsData, isLoading, error } = useQuery({
    queryKey: ['defects'],
    queryFn: () => defectApi.getDefects(),
  });

  const getChartTheme = () => ({
    tooltip: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E5E5',
      borderRadius: '8px',
      color: '#0A0A0A',
    },
    grid: '#E5E5E5',
    axis: '#6B6B6B',
    legend: '#0A0A0A',
  });

  // Generate timeline data for the last 7 days
  const generateTimelineData = (defects: any[]): TimelineData[] => {
    const last7Days: TimelineData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Format the date as YYYY-MM-DD for comparison
      const dateStr = date.toISOString().split('T')[0];
      // Count defects created on this day
      const count = defects.filter((d: any) => {
        const defectDate = new Date(d.created_at).toISOString().split('T')[0];
        return defectDate === dateStr;
      }).length;
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        count,
      });
    }
    
    return last7Days;
  };

  // Calculate stats when data is loaded
  useEffect(() => {
    if (defectsData?.data) {
      const defects = defectsData.data;
      
      // Calculate stats
      const openDefects = defects.filter((d: any) => d.status === 'open');
      const inProgressDefects = defects.filter((d: any) => d.status === 'in_progress');
      const resolvedDefects = defects.filter((d: any) => d.status === 'resolved');
      const closedDefects = defects.filter((d: any) => d.status === 'closed');
      const criticalDefects = defects.filter((d: any) => d.severity === 'critical');
      const highDefects = defects.filter((d: any) => d.severity === 'high');
      
      // Group by assignee
      const assigneeMap = new Map<string, number>();
      defects.forEach((defect: any) => {
        const assigneeName = defect.assigned_to?.username || 'Unassigned';
        if (assigneeMap.has(assigneeName)) {
          assigneeMap.set(assigneeName, assigneeMap.get(assigneeName)! + 1);
        } else {
          assigneeMap.set(assigneeName, 1);
        }
      });
      
      const byAssignee: AssigneeData[] = Array.from(assigneeMap.entries()).map(([name, count]) => ({
        name,
        count,
      })).sort((a, b) => b.count - a.count).slice(0, 5);
      
      // Group by status
      const byStatus: StatusData[] = [
        { name: 'Open', value: openDefects.length },
        { name: 'In Progress', value: inProgressDefects.length },
        { name: 'Resolved', value: resolvedDefects.length },
        { name: 'Closed', value: closedDefects.length },
      ];
      
      // Group by severity
      const bySeverity: SeverityData[] = [
        { name: 'Critical', value: criticalDefects.length },
        { name: 'High', value: highDefects.length },
        { name: 'Medium', value: defects.filter((d: any) => d.severity === 'medium').length },
        { name: 'Low', value: defects.filter((d: any) => d.severity === 'low').length },
      ];
      
      // Generate timeline data (last 7 days)
      const timeline = generateTimelineData(defects);
      
      // Group by category
      const categoryMap = new Map<string, number>();
      defects.forEach((defect: any) => {
        const category = defect.category || 'Uncategorized';
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category)! + 1);
        } else {
          categoryMap.set(category, 1);
        }
      });
      
      const byCategory: CategoryData[] = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count,
      })).sort((a, b) => b.count - a.count);
      
      setStats({
        total: defects.length,
        open: openDefects.length,
        inProgress: inProgressDefects.length,
        resolved: resolvedDefects.length,
        closed: closedDefects.length,
        critical: criticalDefects.length,
        highPriority: highDefects.length,
        byAssignee,
        byCategory,
        byStatus,
        bySeverity,
        timeline,
      });
    }
  }, [defectsData]);

  if (isLoading) {
    return <Loader fullScreen />;
  }
  
  if (error) {
    return (
      <div className="text-center py-10 bg-muted min-h-full">
        <p className="text-red-500">Error loading dashboard data</p>
      </div>
    );
  }

  const chartTheme = getChartTheme();

  return (
    <div className="px-6 py-6 bg-muted min-h-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your defect tracking system</p>
          </div>
          <Link
            to="/defects/create"
            className="bg-primary hover:bg-primary/90:bg-primary text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Defect</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Defects" 
          value={stats.total} 
          icon={<FiActivity className="h-6 w-6" />} 
          color="bg-primary" 
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Open Defects" 
          value={stats.open} 
          icon={<FiAlertCircle className="h-6 w-6" />} 
          color="bg-red-500" 
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard 
          title="Resolved Defects" 
          value={stats.resolved} 
          icon={<FiCheckCircle className="h-6 w-6" />} 
          color="bg-green-500" 
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          title="Critical Defects" 
          value={stats.critical} 
          icon={<FiAlertTriangle className="h-6 w-6" />} 
          color="bg-orange-500" 
          trend={{ value: 2, isPositive: false }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Defects by Status Chart */}
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">Defects by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#6b6b6b"
                  dataKey="value"
                >
                  {stats.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Legend wrapperStyle={{ color: chartTheme.legend }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Trend Chart */}
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">Defect Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="date" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Line type="monotone" dataKey="count" stroke="#0a0a0a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Defects by Severity and Top Assignees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Defects by Severity */}
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">Defects by Severity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.bySeverity}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" stroke={chartTheme.axis} />
                <YAxis stroke={chartTheme.axis} />
                <Tooltip contentStyle={chartTheme.tooltip} />
                <Bar dataKey="value" fill="#0a0a0a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Assignees */}
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">Top Assignees</h3>
          <div className="space-y-4">
            {stats.byAssignee.length > 0 ? (
              stats.byAssignee.slice(0, 5).map((assignee, index) => (
                <div key={assignee.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="ml-3 text-foreground">{assignee.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground text-sm mr-2">{assignee.count} defects</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(assignee.count / Math.max(...stats.byAssignee.map(a => a.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No assignees data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Defects */}
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground">Recent Defects</h3>
            <Link 
              to="/defects" 
              className="text-foreground hover:text-foreground text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {defectsData?.data?.length > 0 ? (
              defectsData.data.slice(0, 5).map((defect: any) => (
                <div key={defect.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      defect.severity === 'critical' ? 'bg-red-500' :
                      defect.severity === 'high' ? 'bg-orange-500' :
                      defect.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <p className="text-foreground font-medium">{defect.title}</p>
                      <p className="text-muted-foreground text-sm">#{defect.id}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    defect.status === 'open' ? 'bg-red-100 text-red-800' :
                    defect.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    defect.status === 'resolved' ? 'bg-muted text-foreground' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {defect.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent defects</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/defects/create"
              className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted transition-colors border border-border"
            >
              <FiPlus className="w-8 h-8 text-foreground mb-2" />
              <span className="text-foreground font-medium">Create Defect</span>
            </Link>
            <Link
              to="/defects"
              className="flex flex-col items-center p-4 bg-muted rounded-lg hover:bg-muted transition-colors border border-border"
            >
              <FiActivity className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-muted-foreground font-medium">View All</span>
            </Link>
            <Link
              to="/defects/closed"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
            >
              <FiCheckCircle className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-green-600 font-medium">Closed</span>
            </Link>
            <Link
              to="/reports"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
            >
              <FiActivity className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-purple-600 font-medium">Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 