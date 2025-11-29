'use client';

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, { AdminUser, CreateAdminPayload } from '@/utils/adminApiService';
import { 
  Shield, 
  Eye, 
  Edit, 
  Trash2,
  User,
  Calendar,
  Crown,
  Settings,
  UserCheck,
  Plus,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';

const permissionOptions = [
  {
    key: 'manageUsers',
    label: 'Manage Users',
    description: 'Create, suspend or update platform users',
    defaultValue: true,
  },
  {
    key: 'manageBots',
    label: 'Manage Bots',
    description: 'Start, stop and edit user bots',
  },
  {
    key: 'viewWallets',
    label: 'Wallet Visibility',
    description: 'View wallet balances and trade wallets',
  },
  {
    key: 'manageCampaigns',
    label: 'Campaign Management',
    description: 'Create or edit marketing campaigns',
  },
  {
    key: 'manageEmails',
    label: 'Email Automation',
    description: 'Trigger email jobs and edit templates',
  },
  {
    key: 'manageTokenBurns',
    label: 'Token Burns',
    description: 'Access burn audit logs and tools',
  },
] as const;

const buildDefaultPermissions = () =>
  permissionOptions.reduce<Record<string, boolean>>((acc, option) => {
    acc[option.key] = Boolean('defaultValue' in option ? option.defaultValue : false);
    return acc;
  }, {});

export default function AdminAdmins() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: buildDefaultPermissions(),
  });
//   const [totalPages] = useState(1);
//   const [pagination] = useState({});

  useEffect(() => {
    fetchAdmins();
  }, [currentPage]);

  const fetchAdmins = async () => {
    try {
      const response = await adminApiService.getAdmins();
      setAdmins(response.data.admins);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-500/20 text-purple-400';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400';
      case 'moderator':
        return 'bg-green-500/20 text-green-400';
      case 'support':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'moderator':
        return <UserCheck className="h-4 w-4" />;
      case 'support':
        return <Settings className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const permissionLabels = useMemo(
    () =>
      permissionOptions.reduce<Record<string, string>>((acc, option) => {
        acc[option.key] = option.label;
        return acc;
      }, {}),
    []
  );

  const AdminCard = ({ admin }: { admin: AdminUser }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-purple-600 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-white">
                {admin.firstName} {admin.lastName}
              </h3>
              <span className={`text-xs px-2 py-1 rounded-full flex items-center space-x-1 ${getRoleColor(admin.role)}`}>
                {getRoleIcon(admin.role)}
                <span className="capitalize">{admin.role.replace('_', ' ')}</span>
              </span>
              <span className={`text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400`}>
                Active
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">{admin.email}</p>
            {admin.username && (
              <p className="text-xs text-gray-500">Username: {admin.username}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-gray-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(admin.createdAt).toLocaleDateString()}
              </span>
            </div>
            {admin.permissions && Object.values(admin.permissions).some(Boolean) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(admin.permissions)
                  .filter(([, value]) => Boolean(value))
                  .map(([key]) => (
                    <span
                      key={key}
                      className="text-[11px] uppercase tracking-wide text-cyan-300/90 bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded-md"
                    >
                      {permissionLabels[key] || key}
                    </span>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <Edit className="h-4 w-4" />
          </button>
          <button className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   // Handle form submission
  // };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Management</h1>
            <p className="text-gray-400 mt-2">Manage admin accounts and permissions</p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setFormError(null);
            }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Admin</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Super Admins</p>
                <p className="text-2xl font-bold text-white">
                  {admins.filter(admin => admin.role === 'super_admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-white">
                  {admins.filter(admin => admin.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Moderators</p>
                <p className="text-2xl font-bold text-white">
                  {admins.filter(admin => admin.role === 'moderator').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-600 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Support</p>
                <p className="text-2xl font-bold text-white">
                  {admins.filter(admin => admin.role === 'support').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admins List */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">All Admins</h3>
          <div className="space-y-4">
            {admins.map((admin) => (
              <AdminCard key={admin.id} admin={admin} />
            ))}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Create Admin</h3>
                <p className="text-sm text-gray-400">Invite a teammate with explicit permissions</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError(null);
                const { username, email, password } = createForm;
                if (!username || !email || !password) {
                  setFormError('Username, email and password are required.');
                  return;
                }
                setIsSaving(true);
                try {
                  const payload: CreateAdminPayload = {
                    username: createForm.username.trim(),
                    email: createForm.email.trim(),
                    password: createForm.password,
                    firstName: createForm.firstName.trim() || undefined,
                    lastName: createForm.lastName.trim() || undefined,
                    role: createForm.role as CreateAdminPayload['role'],
                    permissions: Object.fromEntries(
                      Object.entries(createForm.permissions).filter(([, value]) => Boolean(value))
                    ),
                  };
                  await adminApiService.createAdmin(payload);
                  await fetchAdmins();
                  setShowCreateModal(false);
                  setCreateForm({
                    username: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    password: '',
                    role: 'admin',
                    permissions: buildDefaultPermissions(),
                  });
                } catch (error) {
                  console.error('Create admin failed', error);
                  setFormError(
                    (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
                      'Failed to create admin, please try again.'
                  );
                } finally {
                  setIsSaving(false);
                }
              }}
              className="grid gap-6 px-6 py-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Username *</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="admin_username"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="admin@autobot.io"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">First Name</label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Last Name</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Password *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-white focus:border-cyan-400 focus:outline-none capitalize"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">Permissions</p>
                    <p className="text-xs text-gray-500">
                      Select the modules this admin can access
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setCreateForm((prev) => ({
                        ...prev,
                        permissions: buildDefaultPermissions(),
                      }))
                    }
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-200"
                  >
                    Reset to defaults
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {permissionOptions.map((option) => (
                    <label
                      key={option.key}
                      className="flex cursor-pointer items-start space-x-3 rounded-xl border border-gray-700/70 bg-gray-900/50 p-3 hover:border-cyan-500/40"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.permissions[option.key]}
                        onChange={() =>
                          setCreateForm((prev) => ({
                            ...prev,
                            permissions: {
                              ...prev.permissions,
                              [option.key]: !prev.permissions[option.key],
                            },
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-400"
                      />
                      <span>
                        <span className="font-semibold text-white">{option.label}</span>
                        <span className="block text-xs text-gray-400">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="flex items-center space-x-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 border-t border-gray-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white hover:from-cyan-600 hover:to-blue-700 disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <span>Create Admin</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 