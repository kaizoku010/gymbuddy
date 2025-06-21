import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b font-semibold text-gray-900">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">No notifications</div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-gray-100' : ''}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="text-sm text-gray-800 font-medium">
                    {n.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {n.data && n.data.message ? n.data.message : JSON.stringify(n.data)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
