import React, { useState, useEffect } from 'react';
import {
  Mail,
  Search,
  Filter,
  RefreshCw,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Package,
  Truck,
  ShieldCheck,
  Key,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Inbox,
  Check,
  X
} from 'lucide-react';
import { EmailLog, EmailCategory } from '../../types';
import { api } from '../../services/api';

export const AdminEmailsPage: React.FC = () => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  // Test send custom modal/state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testType, setTestType] = useState<'order_confirmation' | 'shipment_tracking' | 'security_alert' | '2fa_otp' | 'password_reset'>('order_confirmation');

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await api.notifications.getAllEmails({
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined
      });
      setEmails(res.emails || []);
    } catch (err) {
      console.error('Failed to load email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmails();
  };

  const handleResend = async (id: string) => {
    try {
      setResendingId(id);
      const res = await api.notifications.resend(id);
      showNotice(res.message || 'Email resent successfully');
      await fetchEmails();
    } catch (err: any) {
      alert(err.message || 'Failed to resend email');
    } finally {
      setResendingId(null);
    }
  };

  const handleSendTestDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSendingTest(true);
      const res = await api.notifications.sendTest({
        to: testRecipient || undefined,
        type: testType
      });
      showNotice(res.message || 'Test email dispatched successfully');
      setShowTestModal(false);
      await fetchEmails();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch test notification');
    } finally {
      setSendingTest(false);
    }
  };

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const getCategoryBadge = (cat: EmailCategory) => {
    switch (cat) {
      case 'order_confirmation':
        return {
          icon: <Package className="w-3.5 h-3.5" />,
          label: 'Order Confirmation',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'shipment_tracking':
      case 'status_update':
        return {
          icon: <Truck className="w-3.5 h-3.5" />,
          label: 'Shipment Tracking',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'security_alert':
      case 'account_lockout':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'Security Alert',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case '2fa_otp':
      case 'password_reset':
        return {
          icon: <Key className="w-3.5 h-3.5" />,
          label: 'Auth & 2FA OTP',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
        };
      default:
        return {
          icon: <Mail className="w-3.5 h-3.5" />,
          label: 'General Notification',
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Mail className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Email & Notification Center</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time audit log of all automated customer order confirmations, shipment tracking updates, 2FA security codes, and system alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-sm shadow-indigo-100 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Send Test Email</span>
          </button>
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-medium flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Total Sent</span>
            <Mail className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900">{emails.length}</p>
          <p className="text-xs text-slate-400 mt-1">Automated dispatch logs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Order Confirmations</span>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {emails.filter((e) => e.category === 'order_confirmation').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Order receipt dispatches</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Tracking Updates</span>
            <Truck className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {emails.filter((e) => e.category === 'shipment_tracking' || e.category === 'status_update').length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Shipment status alerts</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Security & 2FA</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {
              emails.filter(
                (e) =>
                  e.category === 'security_alert' ||
                  e.category === '2fa_otp' ||
                  e.category === 'account_lockout' ||
                  e.category === 'password_reset'
              ).length
            }
          </p>
          <p className="text-xs text-slate-400 mt-1">OTPs & login alerts</p>
        </div>
      </div>

      {/* Filters & Search Form */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: 'All Logs' },
            { id: 'order_confirmation', label: 'Order Confirmations' },
            { id: 'shipment_tracking', label: 'Shipment Tracking' },
            { id: 'security_alert', label: 'Security Alerts' },
            { id: '2fa_otp', label: '2FA OTPs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient, order #, tracking #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>
      </div>

      {/* Email Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Subject & Details</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Sent Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No outbound emails match your criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try adjusting the filter or search query.
                    </p>
                  </td>
                </tr>
              ) : (
                emails.map((email) => {
                  const badge = getCategoryBadge(email.category);
                  return (
                    <tr
                      key={email.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedEmail(email)}
                    >
                      {/* Recipient */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{email.toName || 'Valued Customer'}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{email.to}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-medium border ${badge.badgeClass}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Subject & Metadata */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {email.subject}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                          {email.metadata?.orderNumber && (
                            <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-semibold">
                              #{email.metadata.orderNumber}
                            </span>
                          )}
                          {email.metadata?.trackingNumber && (
                            <span className="font-mono bg-blue-50 text-blue-700 px-1 py-0.2 rounded font-semibold">
                              {email.metadata.trackingNumber}
                            </span>
                          )}
                          {email.metadata?.otp && (
                            <span className="font-mono bg-purple-50 text-purple-700 px-1 py-0.2 rounded font-bold">
                              OTP: {email.metadata.otp}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span className="capitalize">{email.status}</span>
                        </span>
                      </td>

                      {/* Sent Time */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(email.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedEmail(email)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Preview formatted HTML email"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResend(email.id)}
                            disabled={resendingId === email.id}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Resend email"
                          >
                            <RefreshCw className={`w-4 h-4 ${resendingId === email.id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rendered HTML Email Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">HTML Email Template Viewer</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleResend(selectedEmail.id)}
                  disabled={resendingId === selectedEmail.id}
                  className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendingId === selectedEmail.id ? 'animate-spin' : ''}`} />
                  <span>Resend</span>
                </button>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Email Meta Details */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">{selectedEmail.subject}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                  STATUS: {selectedEmail.status.toUpperCase()}
                </span>
              </div>
              <div className="text-slate-600 space-y-0.5">
                <p><span className="font-semibold text-slate-700">From:</span> {selectedEmail.from}</p>
                <p><span className="font-semibold text-slate-700">To:</span> {selectedEmail.to} ({selectedEmail.toName || 'User'})</p>
                <p><span className="font-semibold text-slate-700">Sent At:</span> {new Date(selectedEmail.sentAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Rendered HTML Container */}
            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <div
                className="prose prose-sm max-w-none text-slate-800"
                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">Email ID: {selectedEmail.id}</span>
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Send Test Notification</h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestDispatch} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  placeholder="e.g. govindkt2004@gmail.com or customer@shopsphere.com"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave empty to send to your currently logged in account.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Template Type</label>
                <select
                  value={testType}
                  onChange={(e: any) => setTestType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="order_confirmation">Order Confirmation Receipt</option>
                  <option value="shipment_tracking">Live Shipment & Tracking Status</option>
                  <option value="security_alert">Account Security Alert (New Device / Lockout)</option>
                  <option value="2fa_otp">Two-Factor Authentication (2FA OTP Code)</option>
                  <option value="password_reset">Password Recovery Instructions</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${sendingTest ? 'animate-spin' : ''}`} />
                  <span>{sendingTest ? 'Sending...' : 'Dispatch Email'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
