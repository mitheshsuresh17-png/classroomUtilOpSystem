import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchUsers, provisionUser, StaffUser } from '../lib/api';
import Dashboard from './Dashboard';
import RoomList from './RoomList';
import BatchList from './BatchList';
import ScheduleView from './ScheduleView';
import AnalyticsView from './AnalyticsView';
import { CourseList } from './CourseList';
import { DepartmentList } from './DepartmentList';
import {
  LayoutDashboard, Calendar, Building2,
  LogOut, Users, ChevronDown, Menu, X,
  ShieldCheck, UserPlus, Eye, CheckCircle2, AlertCircle, RefreshCw,
  BookOpen, Building
} from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'schedules', label: 'Schedules', icon: Calendar },
  { id: 'rooms', label: 'Rooms', icon: Building2 },
  { id: 'batches', label: 'Batches', icon: Users },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'departments', label: 'Departments', icon: Building },
];

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  // Staff management state
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'viewer' as 'coordinator' | 'viewer' });
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');
  const [provisioning, setProvisioning] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const loadStaff = async () => {
    if (user?.role !== 'coordinator') return;
    setLoadingStaff(true);
    setStaffError('');
    try {
      const users = await fetchUsers();
      setStaffList(users);
    } catch (err: any) {
      setStaffError(err.message || 'Failed to load staff list');
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (staffModalOpen) {
      loadStaff();
    }
  }, [staffModalOpen]);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    setStaffSuccess('');
    setProvisioning(true);
    try {
      await provisionUser(staffForm);
      setStaffSuccess(`User ${staffForm.email} provisioned successfully!`);
      setStaffForm({ name: '', email: '', password: '', role: 'viewer' });
      await loadStaff();
    } catch (err: any) {
      setStaffError(err.message || 'Failed to provision staff user');
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/40 shadow-nav">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <img src="/high-resolution-color-logo.png" alt="CLUS Logo" className="h-7 w-auto object-contain drop-shadow-sm" />
              <span className="text-lg font-bold text-gray-800 hidden sm:block">CLUS</span>
            </div>
          </div>

          {/* Desktop tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-gray-100/80 rounded-2xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Side: Role Badge & User Profile */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            {user && (
              <div className="hidden sm:flex items-center">
                {user.role === 'coordinator' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Coordinator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    <Eye className="w-3.5 h-3.5" />
                    Viewer (Read-Only)
                  </span>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user ? getInitials(user.name) : 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fade-up">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                          {user ? getInitials(user.name) : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-800 truncate">{user?.name}</div>
                          <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                          <div className="mt-1">
                            {user?.role === 'coordinator' ? (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-purple-100 text-purple-700">
                                Coordinator
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-sky-100 text-sky-700">
                                Viewer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {user?.role === 'coordinator' && (
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            setStaffModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded-xl transition-colors font-medium"
                        >
                          <UserPlus className="w-4 h-4" />
                          Staff User Management
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Staff Management Modal (Coordinator only) */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Department Staff Management</h3>
                  <p className="text-xs text-slate-500">Provision and manage internal department accounts</p>
                </div>
              </div>
              <button
                onClick={() => setStaffModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Provision Form */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Provision New Staff Account
                </h4>

                {staffError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {staffError}
                  </div>
                )}

                {staffSuccess && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {staffSuccess}
                  </div>
                )}

                <form onSubmit={handleProvision} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Smith"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jsmith@college.edu"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Initial Password</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Role</label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as 'coordinator' | 'viewer' })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="viewer">Viewer (Read-Only Schedules & Analytics)</option>
                      <option value="coordinator">Coordinator (Full Edit & Provisioning)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex justify-end mt-1">
                    <button
                      type="submit"
                      disabled={provisioning}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {provisioning ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          Create Staff Account
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Staff Accounts List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Existing Staff Accounts ({staffList.length})
                  </h4>
                  <button
                    onClick={loadStaff}
                    disabled={loadingStaff}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Refresh List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingStaff ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Name</th>
                        <th className="px-4 py-2.5">Email</th>
                        <th className="px-4 py-2.5">Role</th>
                        <th className="px-4 py-2.5">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                          <td className="px-4 py-2.5 text-slate-600">{s.email}</td>
                          <td className="px-4 py-2.5">
                            {s.role === 'coordinator' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                                Coordinator
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-700">
                                Viewer
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                      {staffList.length === 0 && !loadingStaff && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                            No staff accounts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setStaffModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 p-4 animate-slide-in">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`sidebar-link w-full ${
                    activeTab === tab.id ? 'sidebar-link-active' : 'sidebar-link-inactive'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 lg:px-8 max-w-7xl mx-auto animate-page-enter" key={activeTab}>
        {/* Mobile tab selector */}
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-4 mb-2 -mx-1 px-1 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'schedules' && <ScheduleView />}
        {activeTab === 'rooms' && <RoomList />}
        {activeTab === 'batches' && <BatchList />}
        {activeTab === 'courses' && <CourseList />}
        {activeTab === 'departments' && <DepartmentList />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>
    </div>
  );
}

