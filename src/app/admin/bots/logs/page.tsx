'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, AlertCircle, CheckCircle, Clock, Filter, RefreshCw } from 'lucide-react';
import adminApiService, { LogEntry, BotLogsResponse, Bot } from '../../../../utils/adminApiService';

export default function AllBotsLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBot, setSelectedBot] = useState<string>('all');
  const [logType, setLogType] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const fetchBots = async () => {
    try {
      const response = await adminApiService.getBots();
      
      if (response.data) {
        setBots(response.data.bots || []);
      } else {
        throw new Error('Failed to fetch bots');
      }
    } catch (err) {
      console.error('Error fetching bots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bots');
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);

      // If all bots selected, fetch logs from multiple bots
      if (selectedBot === 'all') {
        const allLogs: LogEntry[] = [];
        
        for (const bot of bots) {
          try {
            const response = await adminApiService.getBotLogs(bot.id, {
              type: logType,
              limit: 50,
              ...(selectedDate && { date: selectedDate })
            });

            if (response.data.success) {
              allLogs.push(...response.data.data.logs);
            }
          } catch (err) {
            console.error(`Error fetching logs for bot ${bot.id}:`, err);
          }
        }
        
        // Sort by timestamp (newest first)
        allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(allLogs.slice(0, 200)); // Limit to 200 most recent logs
      } else {
        // Single bot selected
        const response = await adminApiService.getBotLogs(selectedBot, {
          type: logType,
          limit: 200,
          ...(selectedDate && { date: selectedDate })
        });
        
        if (response.data.success) {
          setLogs(response.data.data.logs);
          setAvailableDates(response.data.data.availableDates);
        } else {
          throw new Error('Failed to fetch logs');
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  useEffect(() => {
    if (bots.length > 0) {
      fetchLogs();
    }
  }, [bots, selectedBot, logType, selectedDate]);

  // Auto refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchLogs, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, selectedBot, logType, selectedDate]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-50 border-red-200';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'INFO': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'LOG': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'TRADE': return 'text-green-600 bg-green-50 border-green-200';
      case 'WALLET': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'DEBUG': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertCircle className="h-4 w-4" />;
      case 'WARNING': return <AlertCircle className="h-4 w-4" />;
      case 'INFO': return <Activity className="h-4 w-4" />;
      case 'LOG': return <Activity className="h-4 w-4" />;
      case 'TRADE': return <CheckCircle className="h-4 w-4" />;
      case 'WALLET': return <Activity className="h-4 w-4" />;
      case 'DEBUG': return <Activity className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
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

  const getBotName = (botId: number) => {
    const bot = bots.find(b => parseInt(b.id) === botId);
    return bot ? (bot.botName || `Bot ${botId}`) : `Bot ${botId}`;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Bot Logs</h1>
              <p className="text-gray-600 mt-1">Monitor logs from all trading bots</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  autoRefresh 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
              </button>
              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Refresh
              </button>
              <Link
                href="/admin/bots"
                className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Back to Bots
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bot</label>
              <select
                value={selectedBot}
                onChange={(e) => setSelectedBot(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Bots</option>
                {bots.map(bot => (
                  <option key={bot.id} value={bot.id.toString()}>
                    {getBotName(parseInt(bot.id))} (ID: {bot.id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Log Type</label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {selectedBot !== 'all' && availableDates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Dates</option>
                  {availableDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Total: {logs.length} logs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Logs List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedBot === 'all' ? 'All Bot Logs' : `${getBotName(parseInt(selectedBot))} Logs`} ({logs.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>No logs found for the selected criteria.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getLevelColor(log.level)}`}>
                      {getLevelIcon(log.level)}
                      {log.level}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/bots/${log.botId}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {getBotName(parseInt(log.botId.toString()))}
                          </Link>
                          <span className="text-xs text-gray-500">(ID: {log.botId})</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-900 mb-2">
                        {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
                      </p>
                      
                      {/* Metadata */}
                      {log.metadata && typeof log.metadata === 'object' && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              Metadata
                            </summary>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {/* Error Details */}
                      {log.error && typeof log.error === 'object' && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-red-600 hover:text-red-800">
                              Error Details
                            </summary>
                            <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.error, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {/* Trade Data */}
                      {log.tradeData && typeof log.tradeData === 'object' && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-green-600 hover:text-green-800">
                              Trade Data
                            </summary>
                            <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.tradeData, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                      
                      {/* Wallet Data */}
                      {log.walletData && typeof log.walletData === 'object' && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-purple-600 hover:text-purple-800">
                              Wallet Data
                            </summary>
                            <pre className="mt-1 p-2 bg-purple-50 rounded text-xs overflow-x-auto">
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
      </div>
    </div>
  );
}
