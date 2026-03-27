import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Star, Building2, GraduationCap, BookOpen, Users, Zap, Sparkles } from 'lucide-react';

const reviews = [
  { name: 'SRM University', role: 'Chennai, TN', text: '"CLUS transformed how we manage 200+ classrooms."', rating: 5, color: 'from-blue-500 to-indigo-500' },
  { name: 'VIT Vellore', role: 'Vellore, TN', text: '"Scheduling conflicts dropped by 80%."', rating: 5, color: 'from-sky-500 to-blue-500' },
  { name: 'Anna University', role: 'Chennai, TN', text: '"Real-time utilization insights changed everything."', rating: 4, color: 'from-indigo-500 to-violet-500' },
  { name: 'IIT Madras', role: 'Chennai, TN', text: '"Clean UI, powerful SQL analytics under the hood."', rating: 5, color: 'from-cyan-500 to-sky-500' },
  { name: 'PSG Tech', role: 'Coimbatore, TN', text: '"Lab allocation is now fully automated."', rating: 5, color: 'from-blue-600 to-indigo-600' },
];

// 2D scattered positions for review cards (top%, left%)
const reviewPositions = [
  { top: '6%', left: '4%', anim: 'animate-float-slow' },
  { top: '18%', left: '52%', anim: 'animate-float-medium' },
  { top: '40%', left: '8%', anim: 'animate-float-fast' },
  { top: '56%', left: '48%', anim: 'animate-float-slow' },
  { top: '76%', left: '12%', anim: 'animate-float-medium' },
];

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animate-page-enter">
      
      {/* ============================================ */}
      {/* LEFT SIDE — Scattered Floating Reviews       */}
      {/* ============================================ */}
      <div className="hidden lg:block lg:w-[48%] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e3a5f 0%, #1e40af 35%, #2563eb 60%, #3b82f6 80%, #60a5fa 100%)' }}
      >
        {/* Subtle glow spots */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-sky-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-blue-300/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] bg-indigo-400/8 rounded-full blur-3xl" />

        {/* Particles */}
        <div className="absolute top-[12%] left-[35%] w-2 h-2 bg-white/20 rounded-full animate-particle-1" />
        <div className="absolute top-[68%] left-[70%] w-1.5 h-1.5 bg-white/15 rounded-full animate-particle-2" />
        <div className="absolute top-[35%] left-[85%] w-2.5 h-2.5 bg-sky-300/15 rounded-full animate-particle-3" />
        <div className="absolute top-[88%] left-[45%] w-2 h-2 bg-white/12 rounded-full animate-particle-1" />

        {/* Floating decorative icons */}
        <div className="absolute top-[5%] right-[8%] p-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 animate-float-slow">
          <GraduationCap className="w-5 h-5 text-white/60" />
        </div>
        <div className="absolute bottom-[6%] left-[5%] p-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 animate-float-medium">
          <BookOpen className="w-5 h-5 text-white/60" />
        </div>
        <div className="absolute top-[48%] right-[4%] p-2 bg-white/8 backdrop-blur-sm rounded-lg border border-white/10 animate-float-fast">
          <Users className="w-4 h-4 text-white/50" />
        </div>

        {/* Floating stat badges */}
        <div className="absolute top-[30%] right-[6%] bg-white/12 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 animate-float-medium">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">500+</div>
              <div className="text-[10px] text-blue-200/70 font-medium">Classrooms Managed</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-[15%] right-[35%] bg-white/12 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 animate-float-slow">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">98%</div>
              <div className="text-[10px] text-blue-200/70 font-medium">Uptime Reliability</div>
            </div>
          </div>
        </div>

        {/* Title in the center area */}
        <div className="absolute bottom-[6%] left-[35%] right-[5%]">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 mb-2">
            <Sparkles className="w-3 h-3 text-sky-300" />
            <span className="text-[11px] font-medium text-sky-200">Trusted by 50+ Institutions</span>
          </div>
        </div>

        {/* ===== Scattered Review Cards across 2D plane ===== */}
        {reviews.map((review, i) => (
          <div
            key={i}
            className={`absolute ${reviewPositions[i].anim}`}
            style={{
              top: reviewPositions[i].top,
              left: reviewPositions[i].left,
              maxWidth: '240px',
            }}
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3.5 border border-white/15 hover:bg-white/15 transition-all duration-500 cursor-default group">
              <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${review.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500`}>
                  <span className="text-white font-bold text-[11px]">{review.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="text-[12px] font-semibold text-white/90 truncate">{review.name}</h4>
                    <div className="flex gap-px shrink-0 ml-1.5">
                      {Array.from({ length: review.rating }).map((_, j) => (
                        <Star key={j} className="w-2 h-2 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-200/60 leading-relaxed">{review.text}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================ */}
      {/* RIGHT SIDE — Auth Form (White BG)            */}
      {/* ============================================ */}
      <div className="w-full lg:w-[52%] flex items-center justify-center p-6 lg:p-12 bg-white min-h-screen relative">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors bg-white/50 hover:bg-gray-100 backdrop-blur-md px-3 py-1.5 rounded-lg z-20"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="w-full max-w-md pt-12 lg:pt-0">
          {/* Logo — static, doesn't change */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2.5 mb-6">
              <img src="/high-resolution-color-logo.png" alt="CLUS Logo" className="h-10 w-auto object-contain drop-shadow-md" />
              <span className="text-2xl font-bold text-gray-800">CLUS</span>
            </div>
          </div>

          {/* Tabs — static, doesn't shift */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-7">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                !isSignUp ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                isSignUp ? 'bg-white text-blue-600 shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Title — changes text only, no layout shift */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 transition-all duration-300">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-400 text-sm mt-1.5 transition-all duration-300">
              {isSignUp ? 'Join institutions already using CLUS' : 'Sign in to your CLUS dashboard'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form — smooth name field transition, no full page re-render */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field: smooth expand/collapse */}
            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{
                maxHeight: isSignUp ? '80px' : '0px',
                opacity: isSignUp ? 1 : 0,
                marginBottom: isSignUp ? '0' : '-20px',
              }}
            >
              <div className="group">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    placeholder="John Doe"
                    tabIndex={isSignUp ? 0 : -1}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@institution.edu"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-8">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-blue-600 font-semibold ml-1.5 hover:text-blue-700 transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          <p className="text-center text-xs text-gray-300 mt-8">
            Secure authentication powered by CLUS
          </p>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-100 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/high-resolution-color-logo.png" alt="CLUS Logo" className="h-6 w-auto object-contain" />
          <span className="text-sm font-bold text-gray-700">CLUS</span>
          <div className="ml-auto flex -space-x-1">
            {reviews.slice(0, 3).map((r, i) => (
              <div key={i} className={`w-6 h-6 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-[8px] font-bold border-2 border-white`}>
                {r.name[0]}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">50+ institutions</span>
        </div>
      </div>
    </div>
  );
}
