'use client';

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminLayout from "../../../components/admin/AdminLayout";
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
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  const fetchUsers = useCallback(async () => {
    try {
      console.log("Fetching users with params:", { currentPage, searchTerm });
      
      // Pass parameters as an object instead of a string
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm
      };

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
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
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
                Platform
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Device
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Bots
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
                  <div className="flex items-center space-x-2">
                    {user.platform ? (
                      <>
                        {user.platform === 'mobile' ? (
                          <Smartphone className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Monitor className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm text-white capitalize">{user.platform}</span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Unknown</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-300">
                    {user.device || 'Unknown'}
                  </span>
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
                    <button className="text-green-400 hover:text-green-300 transition-colors p-1">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-400 hover:text-red-300 transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
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
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
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
        {users.length === 0 && !loading && (
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
      </div>
    </AdminLayout>
  );
} 