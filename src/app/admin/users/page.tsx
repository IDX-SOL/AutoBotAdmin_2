'use client';

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import adminApiService, { User } from "../../../utils/adminApiService";
import {
  User as UserIcon,
  Search,
  Calendar,
  Trash2,
} from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Eye className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Edit className="h-4 w-4" />
          </button> */}
          <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
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
              {/* <Filter className="h-4 w-4" /> */}
              <span>Filter</span>
            </button>
          </form>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

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