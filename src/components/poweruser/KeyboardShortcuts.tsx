'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Keyboard,
  Search,
  Plus,
  Calendar,
  Users,
  Settings,
  FileText,
  CreditCard,
  X,
  Command
} from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  action: () => void;
  section?: string;
}

interface KeyboardShortcutsProps {
  userRole: string;
  section: string;
}

export default function KeyboardShortcuts({ userRole, section }: KeyboardShortcutsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const shortcuts: Shortcut[] = [
    {
      keys: ['Ctrl', 'K'],
      description: 'Quick search',
      action: () => setSearchOpen(true)
    },
    {
      keys: ['G', 'D'],
      description: 'Go to Dashboard',
      action: () => router.push(`/${section}/dashboard`)
    },
    {
      keys: ['G', 'C'],
      description: 'Go to Customers',
      action: () => router.push(`/${section}/customers`)
    },
    {
      keys: ['G', 'S'],
      description: 'Go to Schedule',
      action: () => router.push(`/${section}/schedule`)
    },
    {
      keys: ['G', 'I'],
      description: 'Go to Invoices',
      action: () => router.push(`/${section}/invoices`)
    },
    {
      keys: ['G', 'R'],
      description: 'Go to Reports',
      action: () => router.push(`/${section}/test-report`)
    },
    {
      keys: ['N', 'C'],
      description: 'New Customer',
      action: () => router.push(`/${section}/customers/new`)
    },
    {
      keys: ['N', 'A'],
      description: 'New Appointment',
      action: () => router.push(`/${section}/schedule/new`)
    },
    {
      keys: ['N', 'I'],
      description: 'New Invoice',
      action: () => router.push(`/${section}/invoices/new`)
    }
  ];

  // Add admin-only shortcuts
  if (userRole === 'Company Admin') {
    shortcuts.push(
      {
        keys: ['G', 'E'],
        description: 'Go to Employees',
        action: () => router.push(`/${section}/admin/employees`)
      },
      {
        keys: ['G', 'B'],
        description: 'Go to Branding',
        action: () => router.push(`/${section}/admin/branding`)
      },
      {
        keys: ['N', 'E'],
        description: 'Invite Employee',
        action: () => router.push(`/${section}/admin/employees`)
      }
    );
  }

  const quickSearchItems = [
    { title: 'Dashboard', url: `/${section}/dashboard`, icon: '🏠' },
    { title: 'Customers', url: `/${section}/customers`, icon: '👥' },
    { title: 'Schedule', url: `/${section}/schedule`, icon: '📅' },
    { title: 'Invoices', url: `/${section}/invoices`, icon: '💰' },
    { title: 'Reports', url: `/${section}/test-report`, icon: '📊' },
    { title: 'Settings', url: `/${section}/settings`, icon: '⚙️' },
    ...(userRole === 'Company Admin' ? [
      { title: 'Employees', url: `/${section}/admin/employees`, icon: '👨‍💼' },
      { title: 'Branding', url: `/${section}/admin/branding`, icon: '🎨' }
    ] : [])
  ];

  const filteredSearchItems = quickSearchItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show shortcuts help
      if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsVisible(true);
        return;
      }

      // Quick search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      // Close modals on Escape
      if (event.key === 'Escape') {
        setIsVisible(false);
        setSearchOpen(false);
        setSearchQuery('');
        return;
      }

      // Navigation shortcuts (only when no input is focused)
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Two-key shortcuts
      const twoKeyShortcuts = shortcuts.filter(s => s.keys.length === 2);
      for (const shortcut of twoKeyShortcuts) {
        if (shortcut.keys[0].toLowerCase() === event.key.toLowerCase()) {
          event.preventDefault();
          // Wait for second key
          const secondKeyHandler = (secondEvent: KeyboardEvent) => {
            if (shortcut.keys[1].toLowerCase() === secondEvent.key.toLowerCase()) {
              secondEvent.preventDefault();
              shortcut.action();
            }
            document.removeEventListener('keydown', secondKeyHandler);
          };
          document.addEventListener('keydown', secondKeyHandler);
          setTimeout(() => {
            document.removeEventListener('keydown', secondKeyHandler);
          }, 2000); // 2 second timeout
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, router, section]);

  const formatKeys = (keys: string[]): string => {
    return keys.map(key => {
      switch (key) {
        case 'Ctrl': return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
        case 'Alt': return navigator.platform.includes('Mac') ? '⌥' : 'Alt';
        case 'Shift': return '⇧';
        default: return key.toUpperCase();
      }
    }).join(' + ');
  };

  return (
    <>
      {/* Keyboard Shortcuts Help Modal */}
      {isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Keyboard className="h-6 w-6 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Keyboard Shortcuts</h2>
                  <p className="text-slate-600 text-sm">Navigate faster with these shortcuts</p>
                </div>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="inline-flex items-center">
                          <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800">
                            {key === 'Ctrl' && navigator.platform.includes('Mac') ? '⌘' : key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-slate-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800">
                  <Command className="h-5 w-5" />
                  <span className="font-medium">Pro Tips</span>
                </div>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Press <kbd className="px-1 py-0.5 bg-white border border-blue-200 rounded text-xs font-mono">?</kbd> anytime to see these shortcuts</li>
                  <li>• Most shortcuts work globally across all pages</li>
                  <li>• Navigation shortcuts use G + letter (e.g., G+D for Dashboard)</li>
                  <li>• Creation shortcuts use N + letter (e.g., N+C for New Customer)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50 p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg">
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages and features..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {filteredSearchItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-slate-400 mb-2">No results found</div>
                  <div className="text-sm text-slate-500">Try searching for pages like "customers" or "schedule"</div>
                </div>
              ) : (
                filteredSearchItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      router.push(item.url);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full flex items-center space-x-3 p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-medium text-slate-900">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.url}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
              Press <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono">↑↓</kbd> to navigate,
              <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono ml-1">↵</kbd> to select,
              <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono ml-1">esc</kbd> to close
            </div>
          </div>
        </div>
      )}

      {/* Floating Shortcut Hint */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}