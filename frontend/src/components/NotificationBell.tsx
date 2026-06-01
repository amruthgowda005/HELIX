import React, { useState, useEffect, useRef } from 'react';

interface Notification {
  id: number;
  alert_id: number;
  message: string;
  read: boolean;
  created_at: string | null;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const r = await fetch('http://localhost:8000/api/alerts/notifications?limit=5');
      if (!r.ok) return;
      const data = await r.json();
      setNotifications(data.notifications || []);
    } catch {/* silently fail */}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/api/alerts/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {/* ignore */}
  };

  const markAllRead = async () => {
    await Promise.all(notifications.map(n => markRead(n.id)));
  };

  const unreadCount = notifications.length;
  const hasCritical = notifications.some(n => n.message.includes('[CRITICAL]'));

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition"
        title="Notifications"
      >
        <svg
          className="w-5 h-5 text-gray-400 hover:text-white transition"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black text-white px-1 ${
            hasCritical ? 'bg-red-500 animate-ping' : 'bg-red-500'
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {unreadCount > 0 && hasCritical && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[9px] font-black text-white px-1 bg-red-500">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-[360px] bg-[#0D1421] border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
            <span className="text-sm font-bold text-white">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] text-[#00D4FF] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              <span className="text-2xl block mb-2">✅</span>
              No new notifications
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-800/50">
              {notifications.map(notif => {
                const isCritical = notif.message.includes('[CRITICAL]');
                const isHigh = notif.message.includes('[HIGH]');
                const borderColor = isCritical ? 'border-l-red-600' : isHigh ? 'border-l-orange-500' : 'border-l-yellow-500';
                return (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-gray-800/20 transition border-l-2 ${borderColor}`}
                  >
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                      {notif.message.split('\n')[0]}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-gray-600">
                        {notif.created_at
                          ? new Date(notif.created_at).toLocaleTimeString()
                          : 'Just now'}
                      </span>
                      <button
                        onClick={() => markRead(notif.id)}
                        className="text-[10px] text-[#00D4FF] hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-800 text-center">
            <a
              href="/alerts"
              className="text-xs text-[#00D4FF] hover:underline font-medium"
            >
              View all alerts →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
