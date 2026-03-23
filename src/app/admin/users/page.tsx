'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/admin/AdminLayout";
import { UsersFilterPopup, UsersFilterValues } from "../../../components/admin/UsersFilterPopup";
import { RechargeDetailsPopup } from "../../../components/admin/RechargeDetailsPopup";
import adminApiService, { User } from "../../../utils/adminApiService";
import {
  User as UserIcon,
  Search,
  Calendar,
  Trash2,
  Eye,
  Edit,
  Filter,
  Table,
  Bot,
  Award,
  Grid2X2,
  Smartphone,
  Monitor,
  Users,
  Heart,
  Battery,
  MapPin,
} from "lucide-react";

const SEARCH_DEBOUNCE_MS = 400;

const formatRechargeAmount = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { maximumFractionDigits: 6 });
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<UsersFilterValues | null>(null);

  const [rechargeDetailsOpen, setRechargeDetailsOpen] = useState(false);
  const [rechargeDetailsUserId, setRechargeDetailsUserId] = useState<number | null>(null);

  const openRechargeDetails = (userId: string) => {
    const parsed = parseInt(userId, 10);
    if (!Number.isFinite(parsed)) return;
    setRechargeDetailsUserId(parsed);
    setRechargeDetailsOpen(true);
  };

  const handleRechargePopupOpenChange = (open: boolean) => {
    setRechargeDetailsOpen(open);
    if (!open) setRechargeDetailsUserId(null);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching users with params:", { currentPage, debouncedSearchTerm, appliedFilters });
      
      // Pass parameters as an object instead of a string
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: 20,
        search: debouncedSearchTerm
      };
      // Demo: send filter params to backend (backend will implement filtering)
      if (appliedFilters) {
        if (appliedFilters.recharged) params.recharged = true;
        if (appliedFilters.campaign) params.campaign = true;
        if (appliedFilters.holderGreaterThan1) params.holderGreaterThan1 = true;
        if (appliedFilters.reactionGreaterThan1) params.reactionGreaterThan1 = true;
        if (appliedFilters.botGreaterThan1) params.botGreaterThan1 = true;
      }

      const response = await adminApiService.getUsers(params);
      
      console.log("Raw response:", response);
      console.log("Response type:", typeof response);
      console.log("Response.data:", response?.data);
      
      // Check if response and response.data exist
      if (response && response.data) {
        // Safely extract data with fallbacks
        const usersData = response.data.users || [];
        const paginationData = response.data.pagination || {
          page: currentPage,
          limit: 20,
          total: 0,
          totalPages: 1
        };
        
        console.log("Extracted users data:", usersData);
        console.log("Extracted pagination data:", paginationData);
        
        setUsers(usersData);
        setPagination(paginationData);
        setTotalPages(paginationData.totalPages || 1);
      } else {
        console.warn("Invalid response structure:", response);
        setUsers([]);
        setPagination({
          page: currentPage,
          limit: 20,
          total: 0,
          totalPages: 1
        });
        setTotalPages(1);
      }
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      console.error("Error type:", typeof error);
      console.error("Error stringified:", JSON.stringify(error, null, 2));
      
      // Set default values on error
      setUsers([]);
      setPagination({
        page: currentPage,
        limit: 20,
        total: 0,
        totalPages: 1
      });
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
    // Intentionally use debouncedSearchTerm only; searchTerm is for input only
  }, [currentPage, debouncedSearchTerm, appliedFilters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const UserCard = ({ user }: { user: User }) => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{user.username}</h3>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-gray-500">
                <Calendar className="h-3 w-3 inline mr-1" />
                {new Date(user.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
              {user.platform && (
                <span className="text-xs text-gray-500 flex items-center">
                  {user.platform === 'mobile' ? (
                    <Smartphone className="h-3 w-3 inline mr-1" />
                  ) : (
                    <Monitor className="h-3 w-3 inline mr-1" />
                  )}
                  {user.platform}
                </span>
              )}
              {user.device && (
                <span className="text-xs text-gray-500">
                  {user.device}
                </span>
              )}
              <span className="text-xs text-gray-500 flex items-center">
                <MapPin className="h-3 w-3 inline mr-1 shrink-0" />
                {user.country || 'N/A'} 
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/admin/users/${user.id}`}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Edit User">
            <Edit className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete User">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Bot className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-xs text-gray-400">Volume Bots</p>
            <p className="text-sm font-semibold text-white">{user.totalBots || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-xs text-gray-400">Holders Processed</p>
            <p className="text-sm font-semibold text-white">{user.totalHoldersProcessed || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Heart className="h-4 w-4 text-pink-500" />
          <div>
            <p className="text-xs text-gray-400">Reactions Processed</p>
            <p className="text-sm font-semibold text-white">{user.totalReactionsProcessed || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Battery className="h-4 w-4 text-yellow-500" />
          <div>
            <p className="text-xs text-gray-400">Recharged & Funded</p>
            <p className="text-sm font-semibold text-white">{user.volumeBotsWithRechargeAndFund || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const UserTable = () => (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Platform & Location
              </th>
              
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Bots
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Holders Processed
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Reactions Processed
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Recharged & Funded
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Total Recharge Amount (SOL Eq.)
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Total Platform Fee (SOL Eq.)
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Recharge Details
              </th>
              {/* <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th> */}
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{user.username}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center space-x-2">
                      {user.platform ? (
                        <>
                          {user.platform === 'mobile' ? (
                            <Smartphone className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <Monitor className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                          <span className="text-sm text-white capitalize">{user.platform} ({user.device || 'Unknown'})</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Unknown</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{user.country || 'N/A'}</span>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.campaignName ? (
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-white">{user.campaignName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No campaign</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-white">{user.totalBots || 0}</span>
                    <span className="text-xs text-gray-400">bots</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-white">{user.totalHoldersProcessed || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span className="text-sm text-white">{user.totalReactionsProcessed || 0}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Battery className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-white">{user.volumeBotsWithRechargeAndFund || 0}</span>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-white font-medium">
                    {formatRechargeAmount(user.totalRechargeAmount)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-white font-medium">
                    {formatRechargeAmount(user.totalPlatformFee)}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => openRechargeDetails(user.id)}
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors p-1"
                    title="View recharge details"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">View</span>
                  </button>
                </td>
                {/* <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(user.createdAt).toLocaleDateString('en-IN', { 
                      timeZone: 'Asia/Kolkata',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(user.createdAt).toLocaleTimeString('en-IN', { 
                      timeZone: 'Asia/Kolkata',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    {/* <button className="text-green-400 hover:text-green-300 transition-colors p-1">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-400 hover:text-red-300 transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button> */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-400">
        Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.total)} of {pagination.total} users
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 text-sm font-medium rounded-lg ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Users Management</h1>
            <p className="text-gray-400 mt-2">Manage and monitor user accounts</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              Total: {pagination.total || 0} users
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <form onSubmit={handleSearch} className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
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
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
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
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Table className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm text-gray-400">
            {viewMode === 'table' ? 'Table View' : 'Card View'}
          </div>
        </div>

        {/* Loader / Content below search bar */}
        {loading ? (
          <div className="flex items-center justify-center py-24 bg-gray-800 rounded-xl border border-gray-700 min-h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {/* Users Display */}
            {viewMode === 'table' ? (
              <UserTable />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {users.length === 0 && (
              <div className="text-center py-12">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
                <p className="text-gray-400">Try adjusting your search criteria</p>
              </div>
            )}

            {/* Pagination */}
            {users.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <Pagination />
              </div>
            )}
          </>
        )}
      </div>
      {rechargeDetailsUserId != null && (
        <RechargeDetailsPopup
          open={rechargeDetailsOpen}
          onOpenChange={handleRechargePopupOpenChange}
          userId={rechargeDetailsUserId}
        />
      )}
    </AdminLayout>
  );
} 