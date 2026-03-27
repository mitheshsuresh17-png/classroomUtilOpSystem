import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Sparkles, LayoutDashboard, Calendar, Building2, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #dbeafe 30%, #bfdbfe 60%, #e0f2fe 80%, #f5faff 100%)' }}>
      {/* Decorative BG blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-sky-200/30 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 glass sticky top-0 border-b border-white/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/high-resolution-color-logo.png" alt="CLUS Logo" className="h-8 w-auto object-contain drop-shadow-sm" />
              <span className="text-xl font-bold text-gray-800">CLUS</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#about" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">About</a>
            </div>

            <button
              onClick={() => navigate(isAuthenticated ? '/app' : '/auth')}
              className="px-5 py-2.5 bg-white text-gray-800 text-sm font-semibold rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Start for Free'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-blue-100 rounded-full px-4 py-1.5 mb-8 shadow-sm animate-fade-up">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Welcome to CLUS</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            Your <span className="gradient-text">All-in-One</span> Solution for
            <br />
            Smarter Classroom{' '}
            <span className="relative inline-flex items-center">
              <span className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mx-2 shadow-lg shadow-blue-500/25 animate-hero-float">
                <span className="text-white font-black text-sm md:text-base">C</span>
              </span>
            </span>
            Management
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
            Plan, prioritize, and track every room allocation with ease.
            Powered by advanced SQL analytics.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => navigate(isAuthenticated ? '/app' : '/auth')}
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 group"
            >
              <LayoutDashboard className="w-4 h-4" />
              {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/80 backdrop-blur-sm text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              Learn more
            </a>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-5xl mx-auto mt-20 animate-fade-up" style={{ animationDelay: '400ms' }}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/50">
            <div className="bg-white/80 backdrop-blur-xl">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-gray-100 rounded-lg px-4 py-1 text-xs text-gray-400 font-mono">localhost:5173/app</div>
                </div>
              </div>
              {/* Preview content */}
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Total Rooms', value: '12', icon: Building2, color: 'blue' },
                    { label: 'Schedules', value: '48', icon: Calendar, color: 'green' },
                    { label: 'Free Rooms', value: '3', icon: LayoutDashboard, color: 'teal' },
                    { label: 'Analytics', value: '7', icon: BarChart3, color: 'indigo' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}>
                        <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                        <div className="text-xs text-gray-400">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 h-32 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-gray-300 mr-3" />
                  <span className="text-gray-400 text-sm">Room Utilization Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything you need to manage classroom allocations, powered by advanced database analytics.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {[
              { icon: LayoutDashboard, title: 'Real-time Dashboard', desc: 'Live stats on room usage, schedule conflicts, and availability at a glance.', color: 'blue' },
              { icon: Calendar, title: 'Smart Scheduling', desc: 'Intelligent room allocation with trigger-based conflict prevention.', color: 'indigo' },
              { icon: BarChart3, title: 'Advanced Analytics', desc: 'Deep insights from SQL views, correlated subqueries, and stored procedures.', color: 'teal' },
            ].map((feature, i) => (
              <div key={i} className="card p-6 animate-fade-up">
                <div className={`w-12 h-12 rounded-2xl bg-${feature.color}-50 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-500`} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="relative z-10 border-t border-gray-200/50 py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/high-resolution-color-logo.png" alt="CLUS Logo" className="h-6 w-auto object-contain grayscale opacity-70" />
            <span className="text-sm font-semibold text-gray-600">CLUS — Classroom Utilization System</span>
          </div>
          <p className="text-xs text-gray-400">DBMS Project • Built with React + Express + MySQL</p>
        </div>
      </footer>
    </div>
  );
}
