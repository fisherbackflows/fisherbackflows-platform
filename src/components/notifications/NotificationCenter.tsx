'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  X,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Info,
  UserPlus,
  Calendar,
  CreditCard,
  Settings,
  ChevronDown,
  Filter,
  Trash2
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'invitation' | 'appointment' | 'payment';
  read: boolean;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  userId: string;
  companyId: string;
}

export default function NotificationCenter({ userId, companyId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userId, companyId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // For now, use mock data - in production, fetch from API
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setNotifications(getMockNotifications());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockNotifications = (): Notification[] => {
    const now = new Date();
    return [
      {
        id: '1',
        title: 'New Team Member Joined',
        message: 'Sarah Johnson has accepted your invitation and joined as a Tester',
        type: 'invitation',
        read: false,
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        actionUrl: '/team-portal/admin/employees',
        actionLabel: 'View Team'
      },
      {
        id: '2',
        title: 'Appointment Reminder',
        message: 'Backflow test scheduled for tomorrow at 2:00 PM - Downtown Plaza',
        type: 'appointment',
        read: false,
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/team-portal/schedule',
        actionLabel: 'View Schedule'
      },
      {
        id: '3',
        title: 'Payment Received',
        message: '$450 payment received from City Center Corp',
        type: 'payment',
        read: false,
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/team-portal/invoices',
        actionLabel: 'View Invoice'
      },
      {
        id: '4',
        title: 'Plan Usage Alert',
        message: 'You\'re approaching your team member limit (4/5 users)',
        type: 'warning',
        read: true,
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/team-portal/settings',
        actionLabel: 'Upgrade Plan'
      },
      {
        id: '5',
        title: 'Report Generated',
        message: 'Monthly compliance report is ready for download',
        type: 'success',
        read: true,
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        actionUrl: '/team-portal/test-report',
        actionLabel: 'Download'
      },
      {
        id: '6',
        title: 'System Update',
        message: 'New features have been added to the platform',
        type: 'info',
        read: true,
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
      }
    ];
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'invitation':
        return UserPlus;
      case 'appointment':
        return Calendar;
      case 'payment':
        return CreditCard;
      case 'success':
        return Check;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return X;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'invitation':
        return 'text-blue-600 bg-blue-50';
      case 'appointment':
        return 'text-purple-600 bg-purple-50';
      case 'payment':
        return 'text-green-600 bg-green-50';
      case 'success':
        return 'text-emerald-600 bg-emerald-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${diffInDays}d ago`;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6" />
        ) : (
          <Bell className="h-6 w-6" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Filter Dropdown */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No notifications</p>
                <p className="text-slate-400 text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const colorClass = getNotificationColor(notification.type);

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-slate-900' : 'text-slate-700'
                            }`}>
                              {notification.title}
                              {!notification.read && (
                                <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full inline-block"></span>
                              )}
                            </h4>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-slate-500">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 mt-1">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            {notification.actionUrl && (
                              <button
                                onClick={() => {
                                  markAsRead(notification.id);
                                  window.location.href = notification.actionUrl!;
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {notification.actionLabel || 'View'}
                              </button>
                            )}

                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-slate-500 hover:text-slate-700"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-200">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}