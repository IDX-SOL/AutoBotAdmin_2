'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '../../../../../components/admin/AdminLayout';
import adminApiService, { LogEntry } from '../../../../../utils/adminApiService';

export default function BotLogsPage() {
  const params = useParams();
  const botId = params.botId as string;
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logType, setLogType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    byLevel: Record<string, number>;
    dateRange: {
      earliest: string;
      latest: string;
    } | null;
  } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [pageInput, setPageInput] = useState('');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await adminApiService.getBotLogs(botId, {
        type: logType,
        limit: pageSize,
        page: currentPage,
        ...(selectedDate && { date: selectedDate })
      });
      
      if (response.data.success) {
        setLogs(response.data.data.logs);
        setAvailableDates(response.data.data.availableDates);
        setSummary(response.data.data.summary);
        setTotalLogs(response.data.data.total);
        setTotalPages(response.data.data.totalPages || Math.ceil(response.data.data.total / pageSize));
        setError(null);
      } else {
        throw new Error('Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [botId, logType, selectedDate, currentPage, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'WARNING': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'INFO': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'LOG': return 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30';
      case 'TRADE': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'WALLET': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'DEBUG': return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs for this bot?')) return;
    
    try {
      await adminApiService.clearBotLogs(botId);
      setCurrentPage(1); // Reset to first page
      fetchLogs(); // Refresh the logs
    } catch (err) {
      console.error('Error clearing logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput('');
    }
  };

  if (loading && logs.length === 0) {
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
            <h1 className="text-3xl font-bold text-white">Bot Logs</h1>
            <p className="text-gray-400 mt-1">Bot ID: {botId}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                autoRefresh 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Log Type</label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Logs</option>
                <option value="info">Info</option>
                <option value="log">General Logs</option>
                <option value="error">Error</option>
                <option value="trade">Trade</option>
                <option value="warning">Warning</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Dates</option>
                {availableDates.map(date => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Rows per page</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>
            {summary && (
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Total: {summary.total}</span>
                {Object.entries(summary.byLevel).map(([level, count]) => (
                  <span key={level} className="capitalize">
                    {level}: {count as number}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-400">Error</h3>
                <div className="mt-2 text-sm text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">
                Logs ({totalLogs} total)
              </h2>
              <div className="text-sm text-gray-400">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalLogs)} of {totalLogs}
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                No logs found for the selected criteria.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-700/50">
                  <div className="flex items-start space-x-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(log.level)}`}>
                      {log.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white font-medium">
                          {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                      
                      {/* Metadata */}
                      {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-400 hover:text-white">
                              Metadata
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-700 rounded text-xs overflow-x-auto text-gray-300">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {/* Error Details */}
                      {log.error && typeof log.error === 'object' && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-red-400 hover:text-red-300">
                              Error Details
                            </summary>
                            <pre className="mt-1 p-2 bg-red-500/10 rounded text-xs overflow-x-auto text-red-200">
                              {JSON.stringify(log.error, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {/* Trade Data */}
                      {log.tradeData && typeof log.tradeData === 'object' && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-green-400 hover:text-green-300">
                              Trade Data
                            </summary>
                            <pre className="mt-1 p-2 bg-green-500/10 rounded text-xs overflow-x-auto text-green-200">
                              {JSON.stringify(log.tradeData, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {/* Wallet Data */}
                      {log.walletData && typeof log.walletData === 'object' && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-purple-400 hover:text-purple-300">
                              Wallet Data
                            </summary>
                            <pre className="mt-1 p-2 bg-purple-500/10 rounded text-xs overflow-x-auto text-purple-200">
                              {JSON.stringify(log.walletData, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === totalPages
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  Next
                </button>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                
                {/* Direct page input */}
                <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
                  <label htmlFor="pageInput" className="text-sm text-gray-400">
                    Go to:
                  </label>
                  <input
                    id="pageInput"
                    type="number"
                    min="1"
                    max={totalPages}
                    value={pageInput}
                    onChange={handlePageInputChange}
                    placeholder="Page"
                    className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                  >
                    Go
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
