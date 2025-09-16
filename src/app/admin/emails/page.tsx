'use client';

import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-700 rounded-md flex items-center justify-center text-gray-400">Loading editor...</div>
});
import { Users, Send, Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import adminApiService from '@/utils/adminApiService';
import emailService from '@/utils/emailService';
import { EmailTemplate } from '@/utils/adminApiService';

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}



export default function EmailManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailType, setEmailType] = useState<'individual' | 'bulk' | 'all'>('individual');
  const [searchTerm, setSearchTerm] = useState('');
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
    fetchUsers();
    fetchTemplates();
  }, []);

  // Debug notification state changes
  useEffect(() => {
    if (notification) {
      console.log('🔍 Notification state changed:', notification);
    }
  }, [notification]);

  // Sync editor content when email content changes
  useEffect(() => {
    setEditorContent(emailContent);
  }, [emailContent]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First, get the total count of users
      const initialResponse = await adminApiService.getUsers({ limit: 1, page: 1 });
      if (initialResponse.status !== 200) {
        throw new Error('Failed to get user count');
      }
      
      const totalUsers = initialResponse.data.pagination?.total || 0;
      console.log(`Total users in system: ${totalUsers}`);
      
      if (totalUsers === 0) {
        setUsers([]);
        return;
      }
      
      // Calculate how many pages we need to fetch all users
      const usersPerPage = 100; // Reasonable page size
      const totalPages = Math.ceil(totalUsers / usersPerPage);
      
      let allUsers: User[] = [];
      
      // Fetch all users in batches
      for (let page = 1; page <= totalPages; page++) {
        const response = await adminApiService.getUsers({ 
          limit: usersPerPage, 
          page: page 
        });
        
        if (response.status === 200 && response.data.users) {
          allUsers = [...allUsers, ...response.data.users];
        }
      }
      
      setUsers(allUsers);
      console.log(`Successfully loaded ${allUsers.length} users`);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback: try to get at least some users with a high limit
      try {
        const fallbackResponse = await adminApiService.getUsers({ limit: 1000, page: 1 });
        if (fallbackResponse.status === 200) {
          setUsers(fallbackResponse.data.users || []);
          console.log(`Fallback: Loaded ${fallbackResponse.data.users?.length || 0} users`);
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
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

  const handleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
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

    let targetUsers: string[] = [];
    
    switch (emailType) {
      case 'individual':
        if (selectedUsers.length === 0) {
          showNotification('error', 'Please select at least one user');
          return;
        }
        targetUsers = selectedUsers;
        break;
      case 'bulk':
        if (selectedUsers.length === 0) {
          showNotification('error', 'Please select users for bulk email');
          return;
        }
        targetUsers = selectedUsers;
        break;
      case 'all':
        targetUsers = users.map(user => user.id);
        break;
    }

    try {
      setSending(true);
      
      const emailData = {
        subject: emailSubject,
        content: emailContent,
        userIds: targetUsers,
        type: emailType,
        templateId: selectedTemplate || undefined
      };

      console.log('📧 Sending email with data:', emailData);
      const result = await emailService.sendEmail(emailData);
      console.log('📧 Email service response:', result);
      
      if (result.success) {
        const successMessage = `Email sent successfully to ${targetUsers.length} user(s)!`;
        console.log('✅ Email success:', successMessage);
        showNotification('success', successMessage);
        
        // Reset form
        setEmailSubject('');
        setEmailContent('');
        setEditorContent('');
        setSelectedUsers([]);
        setSelectedTemplate(null);
      } else {
        console.log('❌ Email failed:', result.message);
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

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedUsersCount = () => {
    switch (emailType) {
      case 'individual':
      case 'bulk':
        return selectedUsers.length;
      case 'all':
        return users.length;
      default:
        return 0;
    }
  };

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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Select Users</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  {loading ? 'Loading users...' : `${users.length} total users available`}
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={fetchUsers}
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
                <p className="text-xs text-gray-500">This may take a moment for large user databases</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id)
                          ? 'border-blue-500 bg-blue-600/20'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => handleUserSelection(user.id)}
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
                {filteredUsers.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    {searchTerm ? (
                      <div>
                        <p>No users found matching &quot;{searchTerm}&quot;</p>
                        <p className="text-sm text-gray-500 mt-2">Try a different search term or clear the search</p>
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
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 