import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { defectApi } from '../../services/api';
import { 
  FiActivity, 
  FiClock, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiUsers, 
  FiList,
  FiPlus
} from 'react-icons/fi';
import Loader from '../../components/ui/Loader';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

// Mock data for demonstration
const attendanceData = {
  totalEmployees: 5000,
  checkedIn: 4500,
  notCheckedIn: 500,
  onLeave: 456,
  weeklyOff: 145,
  holiday: 12,
  checkedOut: 250,
};

const onTimeData = [
  { day: '5 Sep', value: 5 },
  { day: '6 Sep', value: -8 },
  { day: '7 Sep', value: 12 },
  { day: '8 Sep', value: -6 },
  { day: '9 Sep', value: 8 },
  { day: '10 Sep', value: 2 },
  { day: '11 Sep', value: 4 },
];

const overtimeData = [
  { day: '5 Sep', hours: 10 },
  { day: '6 Sep', hours: 8 },
  { day: '7 Sep', hours: 42 },
  { day: '8 Sep', hours: 15 },
  { day: '9 Sep', hours: 22 },
  { day: '10 Sep', hours: 18 },
  { day: '11 Sep', hours: 24 },
];

const attendanceSourceData = {
  deviceCheckIns: 2000,
  appCheckIns: 2500,
  activeDevices: 145,
  inactiveDevices: 5
};

const pendingRequests = {
  regularization: 250,
  leave: 500
};

const exceptions = {
  lateComing: 250,
  earlyGoing: 500
};

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  bgColor,
  textColor
}: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  bgColor: string;
  textColor: string;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
    <div className="flex items-start">
      <div className={`flex-shrink-0 w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center mr-4`}>
        <div className={`h-5 w-5 ${textColor}`}>{icon}</div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  </div>
);

// List card component for recent defects
const DefectListItem = ({ defect }: { defect: any }) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <span className="inline-flex items-center mr-2">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
          <span className="text-sm text-red-600">Critical</span>
        </span>;
      case 'high':
        return <span className="inline-flex items-center mr-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
          <span className="text-sm text-orange-600">High</span>
        </span>;
      case 'medium':
        return <span className="inline-flex items-center mr-2">
          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
          <span className="text-sm text-yellow-600">Medium</span>
        </span>;
      case 'low':
        return <span className="inline-flex items-center mr-2">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          <span className="text-sm text-green-600">Low</span>
        </span>;
      default:
        return <span className="inline-flex items-center mr-2">
          <span className="w-2 h-2 bg-gray-500 rounded-full mr-1"></span>
          <span className="text-sm text-gray-600">{severity}</span>
        </span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Open</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">In Progress</span>;
      case 'resolved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Resolved</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Closed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <li className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <Link to={`/defects/${defect.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="font-medium text-gray-900 dark:text-white truncate">{defect.title}</p>
            <div className="flex items-center mt-1">
              {getSeverityBadge(defect.severity)}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                #{defect.id} opened by {defect.created_by?.username || 'Anonymous'}
              </span>
            </div>
          </div>
          <div>
            {getStatusBadge(defect.status)}
          </div>
        </div>
      </Link>
    </li>
  );
};

interface DefectData {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byStatus: { name: string; value: number }[];
  bySeverity: { name: string; value: number }[];
  timeline: { date: string; count: number }[];
}

const Dashboard = () => {
  const [defectStats, setDefectStats] = useState<DefectData>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    byStatus: [],
    bySeverity: [],
    timeline: []
  });

  // Fetch defects data
  const { data: defectsData, isLoading, error } = useQuery({
    queryKey: ['defects'],
    queryFn: () => defectApi.getDefects(),
  });

  // Generate timeline data for the last 7 days
  const generateTimelineData = (defects: any[]) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Format the date as YYYY-MM-DD for comparison
      const dateStr = date.toISOString().split('T')[0];
      // Count defects created on this day
      const count = defects.filter((d) => {
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
      const mediumDefects = defects.filter((d: any) => d.severity === 'medium');
      const lowDefects = defects.filter((d: any) => d.severity === 'low');
      
      // Group by status
      const byStatus = [
        { name: 'Open', value: openDefects.length },
        { name: 'In Progress', value: inProgressDefects.length },
        { name: 'Resolved', value: resolvedDefects.length },
        { name: 'Closed', value: closedDefects.length },
      ];
      
      // Group by severity
      const bySeverity = [
        { name: 'Critical', value: criticalDefects.length },
        { name: 'High', value: highDefects.length },
        { name: 'Medium', value: mediumDefects.length },
        { name: 'Low', value: lowDefects.length },
      ];
      
      // Generate timeline data (last 7 days)
      const timeline = generateTimelineData(defects);
      
      setDefectStats({
        total: defects.length,
        open: openDefects.length,
        inProgress: inProgressDefects.length,
        resolved: resolvedDefects.length,
        closed: closedDefects.length,
        critical: criticalDefects.length,
        high: highDefects.length,
        medium: mediumDefects.length,
        low: lowDefects.length,
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
      <div className="text-center py-10">
        <p className="text-red-500">Error loading dashboard data</p>
      </div>
    );
  }

  // Pie chart colors
  const STATUS_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#6B7280'];
  const SEVERITY_COLORS = ['#DC2626', '#F59E0B', '#FBBF24', '#34D399'];

  // Prepare percentage labels for charts
  const addPercentageLabels = (data: { name: string; value: number }[]) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));
  };

  const statusData = addPercentageLabels(defectStats.byStatus);
  const severityData = addPercentageLabels(defectStats.bySeverity);

  return (
    <div className="px-6 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Overview of your defect tracking system
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/defects/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
          >
            <FiPlus className="mr-2 -ml-1 h-5 w-5" />
            New Defect
          </Link>
        </div>
      </div>

      {/* Defect Stats Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total Defects" 
          value={defectStats.total} 
          icon={<FiList />}
          bgColor="bg-blue-100"
          textColor="text-blue-600" 
        />
        <StatCard 
          title="Open Defects" 
          value={defectStats.open + defectStats.inProgress} 
          icon={<FiClock />}
          bgColor="bg-red-100"
          textColor="text-red-600"
        />
        <StatCard 
          title="Resolved Defects" 
          value={defectStats.resolved + defectStats.closed} 
          icon={<FiCheckCircle />}
          bgColor="bg-green-100"
          textColor="text-green-600"
        />
        <StatCard 
          title="Critical Defects" 
          value={defectStats.critical} 
          icon={<FiAlertTriangle />}
          bgColor="bg-orange-100"
          textColor="text-orange-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Defects by Status</h3>
          </div>
          <div className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center mt-4">
              {statusData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center mx-3 mb-2">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: STATUS_COLORS[index % STATUS_COLORS.length] }}></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{entry.name}: {entry.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Defects by Severity</h3>
          </div>
          <div className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center mt-4">
              {severityData.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center mx-3 mb-2">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: SEVERITY_COLORS[index % SEVERITY_COLORS.length] }}></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{entry.name}: {entry.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Defect Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Defect Trend (Last 7 Days)</h3>
          </div>
          <div className="p-5">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={defectStats.timeline}
                  margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-2">
              <div className="inline-flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">count</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Defects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Defects</h3>
            <Link to="/defects" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {defectsData?.data?.slice(0, 5).map((defect: any) => (
              <DefectListItem key={defect.id} defect={defect} />
            ))}
            {defectsData?.data?.length === 0 && (
              <li className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                No defects found. Start by creating a new defect.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;