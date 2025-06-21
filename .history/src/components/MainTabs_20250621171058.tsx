import React, { useState } from 'react';
import { Home, Plus, User, Video, MessageCircle, Users } from 'lucide-react';
import FeedTab from './tabs/FeedTab';
import CreateTab from './tabs/CreateTab';
import ProfileTab from './tabs/ProfileTab';
import ShortsTab from './tabs/ShortsTab';
import ChatTab from './tabs/ChatTab';
import BuddiesTab from './BuddiesTab';
import NotificationBell from './NotificationBell';

interface MainTabsProps {
  onLogout: () => void;
}

const MainTabs: React.FC<MainTabsProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs: { id: number; name: string; icon: React.ElementType; component: React.FC<any> }[] = [
    { id: 0, name: 'Home', icon: Home, component: FeedTab },
    { id: 1, name: 'Shorts', icon: Video, component: ShortsTab },
    { id: 2, name: 'Buddies', icon: Users, component: BuddiesTab },
    { id: 3, name: 'Create', icon: Plus, component: CreateTab },
    { id: 4, name: 'Chat', icon: MessageCircle, component: ChatTab },
    { id: 5, name: 'Profile', icon: User, component: ProfileTab },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || (() => null);

  const createTab = tabs.find(tab => tab.name === 'Create');
  const bottomNavTabs = tabs.filter(tab => tab.name !== 'Create' && tab.name !== 'Home');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Desktop Sidebar - Fixed, non-scrolling */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:fixed lg:h-screen">
        <div className="p-6 flex items-center justify-between">
          <div className="text-2xl font-bold text-black">Gymie</div>
          <NotificationBell />
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            if (tab.name === 'Create') return null; // Don't show Create button in desktop sidebar list
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                  activeTab === tab.id
                    ? 'bg-black text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <Icon className="w-6 h-6 mr-4" strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                <span className="text-base">{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content - Scrollable, with left margin on desktop to account for fixed sidebar */}
      <div className="flex-1 lg:ml-64 overflow-y-auto">
        {/* Home button for mobile */}
        {/* <div className="lg:hidden fixed top-4 left-4 z-20">
            <button
                onClick={() => setActiveTab(0)}
                className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-md border border-gray-200/30"
            >
                <Home className="w-6 h-6 text-gray-700" />
            </button>
        </div> */}
        <ActiveComponent onLogout={onLogout} />
      </div>

      {/* Mobile Bottom Tab Bar - Floating */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-24 z-50 bg-transparent pointer-events-none">
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/30 pointer-events-auto">
          <div className="flex justify-around items-center h-16 relative">
            {/* Notification Bell Floating Button */}
            <div className="absolute -top-8 right-0 z-10">
              <NotificationBell />
            </div>
            {/* Main nav buttons */}
            {bottomNavTabs.slice(0, 2).map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex flex-col items-center justify-center flex-1 py-2"
                    >
                        <Icon className={`w-6 h-6 mb-1 transition-all ${activeTab === tab.id ? 'text-black' : 'text-gray-400'}`} strokeWidth={activeTab === tab.id ? 2.5 : 1.5}/>
                        <span className={`text-xs font-medium transition-all ${activeTab === tab.id ? 'text-black' : 'text-gray-500'}`}>
                            {tab.name}
                        </span>
                    </button>
                )
            })}

            {createTab && (
                <div className="flex-shrink-0">
                    <button key={createTab.id} onClick={() => setActiveTab(createTab.id)} className="-mt-10 transform transition-transform duration-200 hover:scale-110 focus:outline-none">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-colors
                            ${activeTab === createTab.id ? 'bg-black' : 'bg-neutral-900 hover:bg-black'}`}>
                            <createTab.icon className="w-8 h-8 text-white" />
                        </div>
                    </button>
                </div>
            )}

            {bottomNavTabs.slice(2, 4).map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex flex-col items-center justify-center flex-1 py-2"
                    >
                        <Icon className={`w-6 h-6 mb-1 transition-all ${activeTab === tab.id ? 'text-black' : 'text-gray-400'}`} strokeWidth={activeTab === tab.id ? 2.5 : 1.5}/>
                        <span className={`text-xs font-medium transition-all ${activeTab === tab.id ? 'text-black' : 'text-gray-500'}`}>
                            {tab.name}
                        </span>
                    </button>
                )
            })}
          </div>
        </div>
      </div>

      {/* Add bottom padding on mobile to account for fixed bottom nav */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
};

export default MainTabs;
