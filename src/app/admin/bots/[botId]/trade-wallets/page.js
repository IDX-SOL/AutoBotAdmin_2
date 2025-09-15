'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Wallet, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import adminApiService from '../../../../../utils/adminApiService';

export default function BotTradeWalletsPage() {
  const params = useParams();
  const botId = params.botId;
  
  const [bot, setBot] = useState(null);
  const [tradeWallets, setTradeWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch bot details
        const botResponse = await adminApiService.getBot(botId);
        setBot(botResponse.data);
        
        // Fetch trade wallets
        const walletsResponse = await adminApiService.getBotTradeWallets(botId);
        setTradeWallets(walletsResponse.data.botTeradeWalletsData || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 404) {
          setError('Trade wallets file not found. Please generate wallets first.');
        } else {
          setError(err.response?.data?.error || 'Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (botId) {
      fetchData();
    }
  }, [botId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Wallet className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'text-green-500';
      case 'closed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-6"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <Link
              href="/admin/bots"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bots
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/admin/bots"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bots
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Trade Wallets for {bot?.botName || 'Bot'}
          </h1>
          <p className="text-gray-400">
            Bot ID: {botId} | Owner: {bot?.user?.username || 'Unknown'}
          </p>
        </div>

        {/* Bot Info Card */}
        {bot && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400">Bot Name</p>
                <p className="text-lg font-semibold text-white">{bot.botName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-lg font-semibold text-white capitalize">{bot.status || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Engine</p>
                <p className="text-lg font-semibold text-white">{bot.engine || 'Unknown'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trade Wallets */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Trade Wallets ({tradeWallets.length})
          </h2>
          
          {tradeWallets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No trade wallets found for this bot</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tradeWallets
                .sort((a, b) => {
                  // Sort by createdAt in descending order (most recent first)
                  const dateA = new Date(a.createdAt || 0);
                  const dateB = new Date(b.createdAt || 0);
                  return dateB - dateA;
                })
                .map((wallet, index) => (
                <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(wallet.status)}
                      <span className={`text-sm font-medium capitalize ${getStatusColor(wallet.status)}`}>
                        {wallet.status || 'unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400">Public Key</p>
                      <p className="text-sm text-white font-mono break-all">
                        {wallet.publicKey || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Created</p>
                        <p className="text-sm text-white">
                          {wallet.createdAt ? new Date(wallet.createdAt).toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                }) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    
                    {wallet.closedAt && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Closed</p>
                          <p className="text-sm text-white">
                            {new Date(wallet.closedAt).toLocaleString('en-IN', { 
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 