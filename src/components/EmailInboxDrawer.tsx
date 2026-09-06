import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  X,
  CheckCircle2,
  Truck,
  ShieldAlert,
  Key,
  Package,
  RefreshCw,
  Eye,
  Send,
  ExternalLink,
  Clock,
  Sparkles,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { EmailLog, EmailCategory } from '../types';
import { api } from '../services/api';

interface EmailInboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onNotificationRead?: () => void;
}

export const EmailInboxDrawer: React.FC<EmailInboxDrawerProps> = ({
  isOpen,
  onClose,
  userEmail,
  onNotificationRead
}) => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'tracking' | 'security'>('all');
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await api.notifications.getMyEmails();
      setEmails(res.emails || []);
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (err) {
      console.warn('Failed to load email notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setEmails((prev) => prev.map((e) => ({ ...e, read: true })));
      if (onNotificationRead) onNotificationRead();
      showSuccessFeedback('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResend = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setResendingId(id);
      const res = await api.notifications.resend(id);
      showSuccessFeedback(res.message || 'Notification resent successfully');
      await fetchEmails();
    } catch (err: any) {
      alert(err.message || 'Failed to resend email');
    } finally {
      setResendingId(null);
    }
  };

  const handleSendSample = async (type: 'order_confirmation' | 'shipment_tracking' | 'security_alert') => {
    try {
      setSendingTest(true);
      const res = await api.notifications.sendTest({
        to: userEmail,
        type
      });
      showSuccessFeedback(res.message || 'Test email dispatched!');
      await fetchEmails();
    } catch (err: any) {
      alert(err.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const showSuccessFeedback = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const getCategoryBadge = (cat: EmailCategory) => {
    switch (cat) {
      case 'order_confirmation':
        return {
          icon: <Package className="w-3.5 h-3.5" />,
          label: 'Order Confirmed',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'shipment_tracking':
      case 'status_update':
        return {
          icon: <Truck className="w-3.5 h-3.5" />,
          label: 'Shipment Update',
          classes: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'security_alert':
      case 'account_lockout':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          label: 'Security Alert',
          classes: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case '2fa_otp':
      case 'password_reset':
        return {
          icon: <Key className="w-3.5 h-3.5" />,
          label: 'Auth Verification',
          classes: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      default:
        return {
          icon: <Mail className="w-3.5 h-3.5" />,
          label: 'Notification',
          classes: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  const filteredEmails = emails.filter((item) => {
    if (activeFilter === 'orders') return item.category === 'order_confirmation';
    if (activeFilter === 'tracking') return item.category === 'shipment_tracking' || item.category === 'status_update';
    if (activeFilter === 'security')
      return (
        item.category === 'security_alert' ||
        item.category === '2fa_otp' ||
        item.category === 'account_lockout' ||
        item.category === 'password_reset'
      );
    return true;
  });

  const unreadTotal = emails.filter((e) => !e.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-slate-900">Email & Alert Center</h2>
                      {unreadTotal > 0 && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                          {unreadTotal} new
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Live simulated & SMTP inbox for <span className="font-medium text-slate-700">{userEmail}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchEmails}
                    disabled={loading}
                    title="Refresh Inbox"
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Action Banner / Notification feedback */}
              {actionSuccess && (
                <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionSuccess}</span>
                  </span>
                </div>
              )}

              {/* Quick Sample Trigger & Filter Bar */}
              <div className="px-5 py-3 border-b border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        activeFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({emails.length})
                    </button>
                    <button
                      onClick={() => setActiveFilter('orders')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        activeFilter === 'orders'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Orders
                    </button>
                    <button
                      onClick={() => setActiveFilter('tracking')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        activeFilter === 'tracking'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tracking
                    </button>
                    <button
                      onClick={() => setActiveFilter('security')}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                        activeFilter === 'security'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Security
                    </button>
                  </div>

                  {unreadTotal > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline shrink-0"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Dispatch test trigger buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Trigger Live Simulation:</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleSendSample('order_confirmation')}
                      disabled={sendingTest}
                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors font-medium"
                    >
                      + Order Mail
                    </button>
                    <button
                      onClick={() => handleSendSample('shipment_tracking')}
                      disabled={sendingTest}
                      className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors font-medium"
                    >
                      + Tracking Mail
                    </button>
                    <button
                      onClick={() => handleSendSample('security_alert')}
                      disabled={sendingTest}
                      className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors font-medium"
                    >
                      + Security Alert
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content: Email List OR Single Email HTML Preview */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50">
                {selectedEmail ? (
                  /* Single Rendered Email View */
                  <div className="p-6 bg-white min-h-full flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                      <button
                        onClick={() => setSelectedEmail(null)}
                        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <span>← Back to all messages</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => handleResend(e, selectedEmail.id)}
                          disabled={resendingId === selectedEmail.id}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${resendingId === selectedEmail.id ? 'animate-spin' : ''}`}
                          />
                          <span>Resend Email</span>
                        </button>
                      </div>
                    </div>

                    {/* Email Meta Details Header */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 mb-6 text-xs text-slate-600">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-1">{selectedEmail.subject}</h3>
                          <div className="space-y-0.5">
                            <p>
                              <span className="font-semibold text-slate-700">From:</span> {selectedEmail.from}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700">To:</span> {selectedEmail.to}{' '}
                              {selectedEmail.toName ? `(${selectedEmail.toName})` : ''}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-700">Date:</span>{' '}
                              {new Date(selectedEmail.sentAt).toLocaleString('en-US', {
                                dateStyle: 'full',
                                timeStyle: 'medium'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              getCategoryBadge(selectedEmail.category).classes
                            }`}
                          >
                            {getCategoryBadge(selectedEmail.category).icon}
                            <span>{getCategoryBadge(selectedEmail.category).label}</span>
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Status:{' '}
                            <span className="font-semibold text-emerald-600 uppercase">
                              {selectedEmail.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Rendered HTML Email Container */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                        <span>Rendered Responsive HTML Template</span>
                        <span>ShopSphere Automated Dispatcher</span>
                      </div>
                      <div
                        className="p-4 overflow-x-auto text-slate-800"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Email List View */
                  <div className="p-4 space-y-3">
                    {filteredEmails.length === 0 ? (
                      <div className="text-center py-16 px-4">
                        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                          <Inbox className="w-7 h-7" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mb-1">No notifications found</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                          When you place orders, track shipments, or perform security actions, automated email
                          receipts will arrive here.
                        </p>
                        <button
                          onClick={() => handleSendSample('order_confirmation')}
                          className="inline-flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Dispatch a test Order Confirmation</span>
                        </button>
                      </div>
                    ) : (
                      filteredEmails.map((item) => {
                        const badge = getCategoryBadge(item.category);
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedEmail(item);
                              if (!item.read) handleMarkAsRead(item.id);
                            }}
                            className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                              !item.read
                                ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50 hover:border-indigo-300'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                            }`}
                          >
                            {!item.read && (
                              <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-600" />
                            )}

                            <div className="flex items-start justify-between mb-2 pr-4">
                              <span
                                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}
                              >
                                {badge.icon}
                                <span>{badge.label}</span>
                              </span>

                              <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {item.subject}
                            </h4>

                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                              {item.previewText || 'Click to view the complete formatted email notification.'}
                            </p>

                            {/* Footer metadata */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                              <div className="flex items-center space-x-2">
                                {item.metadata?.orderNumber && (
                                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                                    #{item.metadata.orderNumber}
                                  </span>
                                )}
                                {item.metadata?.trackingNumber && (
                                  <span className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                                    {item.metadata.trackingNumber}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => handleResend(e, item.id)}
                                  disabled={resendingId === item.id}
                                  className="text-slate-500 hover:text-indigo-600 font-medium flex items-center space-x-1 p-1 hover:bg-slate-100 rounded"
                                  title="Resend email"
                                >
                                  <RefreshCw
                                    className={`w-3 h-3 ${resendingId === item.id ? 'animate-spin' : ''}`}
                                  />
                                  <span className="text-[10px]">Resend</span>
                                </button>
                                <span className="text-indigo-600 font-semibold flex items-center space-x-0.5">
                                  <span>View HTML</span>
                                  <Eye className="w-3 h-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
                <span>ShopSphere Automated Notification Service</span>
                <span className="flex items-center space-x-1 text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>SMTP & Live Log Ready</span>
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
