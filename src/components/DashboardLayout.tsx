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
import FacultyList from './FacultyList';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  LogOut,
  Users,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  UserPlus,
  Eye,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Building,
  BarChart3,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'schedules', label: 'Schedules', icon: Calendar },
  { id: 'faculty', label: 'Faculty', icon: GraduationCap },
  { id: 'rooms', label: 'Rooms', icon: Building2 },
  { id: 'batches', label: 'Batches', icon: Users },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'departments', label: 'Departments', icon: Building },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  // Staff management state
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as 'coordinator' | 'viewer',
  });
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
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden h-9 w-9"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <img
                src="/high-resolution-color-logo.png"
                alt="CLUS Logo"
                className="h-8 w-auto object-contain drop-shadow-sm"
              />
              <span className="text-lg font-bold tracking-tight text-foreground hidden sm:block">
                CLUS
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-muted/60 rounded-xl p-1 border border-border/50">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Side: Role Badge & User Profile */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            {user && (
              <div className="hidden sm:flex items-center">
                {user.role === 'coordinator' ? (
                  <Badge variant="default" className="flex items-center gap-1.5 py-1 px-2.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Coordinator
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5 font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    Viewer
                  </Badge>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 h-auto rounded-xl hover:bg-muted"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold">
                  {user ? getInitials(user.name) : 'U'}
                </div>
                <span className="text-xs font-semibold text-foreground hidden sm:block max-w-[120px] truncate">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-72 bg-popover rounded-xl shadow-xl border border-border py-2 animate-fade-up">
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold">
                          {user ? getInitials(user.name) : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground truncate">{user?.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                          <div className="mt-1">
                            <Badge variant={user?.role === 'coordinator' ? 'default' : 'secondary'} className="text-[10px] py-0 px-2">
                              {user?.role?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-1">
                      {user?.role === 'coordinator' && (
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            setStaffModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent rounded-lg transition-colors"
                        >
                          <UserPlus className="w-4 h-4 text-primary" />
                          Staff User Management
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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

      {/* Staff Management Dialog (Coordinator only) */}
      {staffModalOpen && (
        <Dialog open={staffModalOpen} onOpenChange={(open) => !open && setStaffModalOpen(false)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle>Department Staff Management</DialogTitle>
                  <DialogDescription>Provision and manage authorized internal user accounts</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-2">
              {/* Provision Form */}
              <div className="bg-muted/40 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                  <UserPlus className="w-3.5 h-3.5 text-primary" />
                  <span>Provision New Staff Account</span>
                </div>

                {staffError && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{staffError}</AlertDescription>
                  </Alert>
                )}

                {staffSuccess && (
                  <Alert variant="success" className="mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{staffSuccess}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleProvision} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="staff-name">Full Name</Label>
                    <Input
                      id="staff-name"
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Smith"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="staff-email">Email Address</Label>
                    <Input
                      id="staff-email"
                      type="email"
                      required
                      placeholder="e.g. jsmith@college.edu"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="staff-password">Initial Password</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={staffForm.password}
                      onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="staff-role">Role</Label>
                    <Select
                      value={staffForm.role}
                      onValueChange={(val) =>
                        setStaffForm({ ...staffForm, role: val as 'coordinator' | 'viewer' })
                      }
                    >
                      <SelectTrigger id="staff-role">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer (Read-Only Schedules & Analytics)</SelectItem>
                        <SelectItem value="coordinator">Coordinator (Full Edit & Provisioning)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 flex justify-end mt-1">
                    <Button type="submit" disabled={provisioning}>
                      {provisioning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Provisioning...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Staff Account
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Staff Accounts List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Existing Staff Accounts ({staffList.length})
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadStaff}
                    disabled={loadingStaff}
                    className="h-8 px-2"
                    title="Refresh List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingStaff ? 'animate-spin' : ''}`} />
                  </Button>
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffList.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-semibold text-foreground">{s.name}</TableCell>
                          <TableCell className="text-muted-foreground">{s.email}</TableCell>
                          <TableCell>
                            <Badge variant={s.role === 'coordinator' ? 'default' : 'secondary'}>
                              {s.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {staffList.length === 0 && !loadingStaff && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                            No staff accounts found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStaffModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-16 bottom-0 w-64 bg-background border-r border-border p-4 animate-slide-in">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="pt-20 pb-12 px-4 lg:px-8 max-w-7xl mx-auto animate-page-enter" key={activeTab}>
        {/* Mobile tab scrollbar */}
        <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-4 mb-2 -mx-1 px-1 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'schedules' && <ScheduleView />}
        {activeTab === 'faculty' && <FacultyList />}
        {activeTab === 'rooms' && <RoomList />}
        {activeTab === 'batches' && <BatchList />}
        {activeTab === 'courses' && <CourseList />}
        {activeTab === 'departments' && <DepartmentList />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>
    </div>
  );
}
