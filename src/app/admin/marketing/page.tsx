'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import dynamic from 'next/dynamic';
import { UsersFilterPopup, UsersFilterValues } from '@/components/admin/UsersFilterPopup';

const JoditEditor = dynamic(() => import('jodit-react'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">Loading editor...</div>
});
import { Users, Send, Save, Eye, EyeOff, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';
import adminApiService, { EmailTemplate, User } from '@/utils/adminApiService';
import emailService from '@/utils/emailService';

const SEARCH_DEBOUNCE_MS = 400;
const USERS_PAGE_LIMIT = 20;

export default function EmailManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUserEmails, setSelectedUserEmails] = useState<Record<string, string>>({});
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailType, setEmailType] = useState<'individual' | 'bulk' | 'all'>('individual');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: USERS_PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<UsersFilterValues | null>(null);
  const [broadcastUserTotal, setBroadcastUserTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [editorContent, setEditorContent] = useState('');

  // Jodit Editor configuration
  const joditConfig = {
    readonly: false,
    height: 400,
    theme: 'dark',
    toolbar: true,
    toolbarButtonSize: 'middle' as const,
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html' as const,
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', '|',
      'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'symbol', 'fullsize', 'print', 'about'
    ],
    removeButtons: ['brush', 'file'],
    zIndex: 0,
    maxHeight: 500,
    direction: 'ltr' as const,
    language: 'en',
    debugLanguage: false,
    i18n: {
      'en': {
        'Type something': 'Type something...',
        'Advanced': 'Advanced',
        'Source': 'Source',
        'Bold': 'Bold',
        'Italic': 'Italic',
        'Underline': 'Underline',
        'Strikethrough': 'Strikethrough',
        'Superscript': 'Superscript',
        'Subscript': 'Subscript',
        'Align Left': 'Align Left',
        'Center': 'Center',
        'Align Right': 'Align Right',
        'Justify': 'Justify',
        'Ordered List': 'Ordered List',
        'Unordered List': 'Unordered List',
        'Indent': 'Indent',
        'Outdent': 'Outdent',
        'Font': 'Font',
        'Font Size': 'Font Size',
        'Text Color': 'Text Color',
        'Background Color': 'Background Color',
        'Insert Link': 'Insert Link',
        'Insert Image': 'Insert Image',
        'Insert Table': 'Insert Table',
        'Undo': 'Undo',
        'Redo': 'Redo',
        'Cut': 'Cut',
        'Copy': 'Copy',
        'Paste': 'Paste',
        'Select All': 'Select All',
        'Remove Format': 'Remove Format',
        'Full Screen': 'Full Screen',
        'Print': 'Print',
        'About': 'About'
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await adminApiService.getUsers({ limit: 1, page: 1 });
        setBroadcastUserTotal(r.data?.pagination?.total ?? 0);
      } catch {
        setBroadcastUserTotal(0);
      }
    })();
  }, []);

  // Sync editor content when email content changes
  useEffect(() => {
    setEditorContent(emailContent);
  }, [emailContent]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: USERS_PAGE_LIMIT,
        search: debouncedSearchTerm,
      };
      if (appliedFilters) {
        if (appliedFilters.recharged) params.recharged = true;
        if (appliedFilters.campaign) params.campaign = true;
        if (appliedFilters.holderGreaterThan1) params.holderGreaterThan1 = true;
        if (appliedFilters.reactionGreaterThan1) params.reactionGreaterThan1 = true;
        if (appliedFilters.botGreaterThan1) params.botGreaterThan1 = true;
      }

      const response = await adminApiService.getUsers(params);

      if (response?.data) {
        const usersData = response.data.users || [];
        const paginationData = response.data.pagination || {
          page: currentPage,
          limit: USERS_PAGE_LIMIT,
          total: 0,
          totalPages: 1,
        };
        setUsers(usersData);
        setPagination(paginationData);
        setTotalPages(paginationData.totalPages || 1);
      } else {
        setUsers([]);
        setPagination({
          page: currentPage,
          limit: USERS_PAGE_LIMIT,
          total: 0,
          totalPages: 1,
        });
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setPagination({
        page: currentPage,
        limit: USERS_PAGE_LIMIT,
        total: 0,
        totalPages: 1,
      });
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, appliedFilters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const refreshUsersAndBroadcastTotal = async () => {
    await fetchUsers();
    try {
      const r = await adminApiService.getUsers({ limit: 1, page: 1 });
      setBroadcastUserTotal(r.data?.pagination?.total ?? 0);
    } catch {
      /* ignore */
    }
  };

  const fetchTemplates = async () => {
    try {
      const fetchedTemplates = await emailService.getTemplates();
      if (fetchedTemplates.length === 0) {
        // Fallback to mock templates if none exist
        const mockTemplates: EmailTemplate[] = [
          {
            id: 1,
            name: 'Welcome Email',
            subject: 'Welcome to AutoBot Platform',
            content: '<h2>Welcome to AutoBot!</h2><p>We\'re excited to have you on board.</p>',
            createdBy: 1,
            isActive: true,
            category: 'welcome',
            tags: ['welcome', 'onboarding'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Maintenance Notice',
            subject: 'Scheduled Maintenance Notice',
            content: '<h2>Maintenance Notice</h2><p>We will be performing scheduled maintenance.</p>',
            createdBy: 1,
            isActive: true,
            category: 'maintenance',
            tags: ['maintenance', 'notice'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setTemplates(mockTemplates);
      } else {
        setTemplates(fetchedTemplates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Use mock templates as fallback
      const mockTemplates: EmailTemplate[] = [
        {
          id: 1,
          name: 'Welcome Email',
          subject: 'Welcome to AutoBot Platform',
          content: '<h2>Welcome to AutoBot!</h2><p>We\'re excited to have you on board.</p>',
          createdBy: 1,
          isActive: true,
          category: 'welcome',
          tags: ['welcome', 'onboarding'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Maintenance Notice',
          subject: 'Scheduled Maintenance Notice',
          content: '<h2>Maintenance Notice</h2><p>We will be performing scheduled maintenance.</p>',
          createdBy: 1,
          isActive: true,
          category: 'maintenance',
          tags: ['maintenance', 'notice'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
    }
  };

  const handleUserSelection = (user: User) => {
    const userId = user.id;
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
      setSelectedUserEmails((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } else {
      setSelectedUsers([...selectedUsers, userId]);
      setSelectedUserEmails((prev) => ({ ...prev, [userId]: user.email }));
    }
  };

  const handleSelectAllOnPage = () => {
    const pageIds = users.map((u) => u.id);
    const allPageSelected =
      pageIds.length > 0 && pageIds.every((id) => selectedUsers.includes(id));
    if (allPageSelected) {
      setSelectedUsers(selectedUsers.filter((id) => !pageIds.includes(id)));
      setSelectedUserEmails((prev) => {
        const next = { ...prev };
        pageIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    } else {
      const idSet = new Set([...selectedUsers, ...pageIds]);
      setSelectedUsers([...idSet]);
      setSelectedUserEmails((prev) => {
        const next = { ...prev };
        users.forEach((u) => {
          next[u.id] = u.email;
        });
        return next;
      });
    }
  };

  const collectAllUserEmails = async (): Promise<string[]> => {
    const limit = 100;
    const first = await adminApiService.getUsers({ limit, page: 1 });
    const total = first.data?.pagination?.total ?? 0;
    const pages = Math.max(1, Math.ceil(total / limit));
    const emails: string[] = [];
    for (let page = 1; page <= pages; page++) {
      const res = await adminApiService.getUsers({ limit, page });
      if (res.status === 200 && res.data?.users) {
        for (const u of res.data.users) {
          if (u.email) emails.push(u.email);
        }
      }
    }
    return emails;
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setEmailSubject(template.subject);
    setEmailContent(template.content);
    setEditorContent(template.content);
    setSelectedTemplate(template.id);
    setShowTemplates(false);
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      showNotification('error', 'Please fill in both subject and content');
      return;
    }

    // Validate email content
    const validation = emailService.validateEmailContent(emailContent);
    if (!validation.isValid) {
      showNotification('error', `Content validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    switch (emailType) {
      case 'individual':
        if (selectedUsers.length === 0) {
          showNotification('error', 'Please select at least one user');
          return;
        }
        break;
      case 'bulk':
        if (selectedUsers.length === 0) {
          showNotification('error', 'Please select users for bulk email');
          return;
        }
        break;
      case 'all':
        break;
    }

    try {
      setSending(true);

      let recipients: string[];
      if (emailType === 'individual' || emailType === 'bulk') {
        recipients = selectedUsers.map((id) => selectedUserEmails[id]).filter(Boolean);
        if (recipients.length !== selectedUsers.length) {
          showNotification(
            'error',
            'Some selected users are missing an email address. Refresh the list and select again.'
          );
          return;
        }
      } else {
        recipients = await collectAllUserEmails();
      }

      if (recipients.length === 0) {
        showNotification('error', 'No recipient email addresses to send to.');
        return;
      }

      const template =
        selectedTemplate != null ? templates.find((t) => t.id === selectedTemplate) : undefined;
      const name = template?.name?.trim() || emailSubject.trim() || 'Email';
      const mailType = emailType === 'individual' ? 'series' : 'bulk';

      const result = await emailService.sendMarketingMailAws({
        name,
        subject: emailSubject,
        content: emailContent,
        type: mailType,
        recipients,
      });

      if (result.success) {
        const successMessage = `Email sent successfully to ${recipients.length} recipient(s)!`;
        showNotification('success', successMessage);

        setEmailSubject('');
        setEmailContent('');
        setEditorContent('');
        setSelectedUsers([]);
        setSelectedUserEmails({});
        setSelectedTemplate(null);
      } else {
        showNotification('error', result.message);
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      showNotification('error', 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    console.log(`🔔 Showing ${type} notification:`, message);
    setNotification({ type, message });
    // Keep notification visible longer for success messages
    const duration = type === 'success' ? 8000 : 5000;
    setTimeout(() => {
      console.log(`🔔 Clearing ${type} notification`);
      setNotification(null);
    }, duration);
  };

  const getSelectedUsersCount = () => {
    switch (emailType) {
      case 'individual':
      case 'bulk':
        return selectedUsers.length;
      case 'all':
        return broadcastUserTotal;
      default:
        return 0;
    }
  };

  const pageUserIds = users.map((u) => u.id);
  const allPageSelected =
    pageUserIds.length > 0 && pageUserIds.every((id) => selectedUsers.includes(id));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Email Management</h1>
            <p className="text-gray-400 mt-2">Send emails to users with rich text editor</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Templates</span>
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showPreview ? 'Hide Preview' : 'Preview'}</span>
            </button>
          </div>
        </div>

        {/* Email Type Selection */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Email Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setEmailType('individual')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                emailType === 'individual'
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Individual</span>
              </div>
              <p className="text-sm mt-2 opacity-75">Send to specific users</p>
            </button>
            
            <button
              onClick={() => setEmailType('bulk')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                emailType === 'bulk'
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Bulk</span>
              </div>
              <p className="text-sm mt-2 opacity-75">Send to selected users</p>
            </button>
            
            <button
              onClick={() => setEmailType('all')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                emailType === 'all'
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>All Users</span>
              </div>
              <p className="text-sm mt-2 opacity-75">Send to all users</p>
            </button>
          </div>
        </div>

        {/* Email Templates */}
        {showTemplates && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Email Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-gray-600 rounded-lg hover:border-gray-500 cursor-pointer transition-colors"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <h4 className="font-medium text-white">{template.name}</h4>
                  <p className="text-sm text-gray-400 mt-1">{template.subject}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {new Date(template.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Composition */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Compose Email</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content
              </label>
              <div className="border border-gray-600 rounded-md overflow-hidden">
                <JoditEditor
                  ref={editorRef}
                  value={editorContent}
                  config={joditConfig}
                  onBlur={(newContent) => setEmailContent(newContent)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-400">
                Recipients: {getSelectedUsersCount()} user(s)
              </div>
              <button
                onClick={handleSendEmail}
                disabled={sending || !emailSubject.trim() || !emailContent.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                <Send className="h-4 w-4" />
                <span>{sending ? 'Sending...' : 'Send Email'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Email Preview */}
        {showPreview && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Email Preview</h3>
            <div className="bg-white rounded-lg p-6 text-gray-800">
              <h2 className="text-xl font-bold mb-2">{emailSubject || 'No subject'}</h2>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: emailService.formatEmailContent(emailContent) || '<p>No content</p>' }}
              />
            </div>
          </div>
        )}
        {notification && (
          <div className={`p-4 rounded-lg border-2 ${
            notification.type === 'success' 
              ? 'bg-green-900/50 border-green-500 text-green-200 shadow-lg shadow-green-500/20' 
              : 'bg-red-900/50 border-red-500 text-red-200 shadow-lg shadow-red-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {/* User Selection (for individual and bulk emails) */}
        {(emailType === 'individual' || emailType === 'bulk') && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <h3 className="text-lg font-semibold text-white">Select Users</h3>
                <div className="text-sm text-gray-400">
                  {loading
                    ? 'Loading users...'
                    : `${pagination.total} user(s) match filters · ${selectedUsers.length} selected`}
                </div>
              </div>

              <form
                onSubmit={handleSearch}
                className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4"
              >
                <div className="flex-1 relative min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search users by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shrink-0"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </button>
                <UsersFilterPopup
                  open={filterOpen}
                  onOpenChange={setFilterOpen}
                  onApply={(filters) => {
                    setAppliedFilters(filters);
                    setCurrentPage(1);
                  }}
                  initialFilters={appliedFilters ?? undefined}
                />
              </form>

              <div className="flex flex-wrap items-center gap-4 justify-end">
                <button
                  type="button"
                  onClick={handleSelectAllOnPage}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {allPageSelected ? 'Deselect page' : 'Select page'}
                </button>
                <button
                  type="button"
                  onClick={() => void refreshUsersAndBroadcastTotal()}
                  disabled={loading}
                  className="text-sm text-green-400 hover:text-green-300 disabled:text-gray-500"
                  title="Refresh user list"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-400">Loading users...</p>
                <p className="text-xs text-gray-500">Use search and filters to narrow the list</p>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.includes(user.id)
                            ? 'border-blue-500 bg-blue-600/20'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => handleUserSelection(user)}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {}}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{user.username}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {users.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      {debouncedSearchTerm ? (
                        <div>
                          <p>No users found matching &quot;{debouncedSearchTerm}&quot;</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Try a different search term or adjust filters
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p>No users available</p>
                          <p className="text-sm text-gray-500 mt-2">Check if users exist in the system</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {users.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-700">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 