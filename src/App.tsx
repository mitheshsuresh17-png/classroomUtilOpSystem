import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import RoomList from './components/RoomList';
import ScheduleView from './components/ScheduleView';
import AnalyticsView from './components/AnalyticsView';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center shadow-lg rounded-md px-2 bg-gradient-to-tr from-blue-700 to-indigo-500">
                <span className="text-xl font-black text-white px-2 tracking-wider">CLUS</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${activeTab === 'dashboard' ? 'border-blue-500 text-gray-900 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('schedules')}
                  className={`${activeTab === 'schedules' ? 'border-blue-500 text-gray-900 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Schedules
                </button>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`${activeTab === 'rooms' ? 'border-blue-500 text-gray-900 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Rooms
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`${activeTab === 'analytics' ? 'border-indigo-500 text-indigo-700 font-bold' : 'border-transparent text-indigo-400 hover:text-indigo-600 hover:border-indigo-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  Advanced Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'schedules' && <ScheduleView />}
        {activeTab === 'rooms' && <RoomList />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>
    </div>
  );
}

export default App;
