'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, MessageSquare, RefreshCw, Search, User } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import adminApiService, {
  SupportConversationDetail,
  SupportConversationItem,
} from '@/utils/adminApiService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
};

function UserCell({ conv }: { conv: SupportConversationItem }) {
  const email = conv.userEmail || conv.user?.email;
  const userId = conv.userId || conv.user?.id;
  return (
    <div className="min-w-0">
      {userId ? (
        <Link
          href={`/admin/users/${userId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
        >
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{email || conv.username || `User #${userId}`}</span>
        </Link>
      ) : (
        <span className="text-gray-500 flex items-center gap-1">
          <User className="h-3 w-3" />
          Guest
        </span>
      )}
      {conv.username && email && (
        <p className="text-xs text-gray-500 truncate">{conv.username}</p>
      )}
    </div>
  );
}

export default function AiSupportConversationsPage() {
  const [conversations, setConversations] = useState<SupportConversationItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SupportConversationDetail | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApiService.getSupportConversations({
        page,
        limit,
        ...(search ? { search } : {}),
      });
      const payload = response.data?.data;
      setConversations(payload?.conversations ?? []);
      setTotalPages(payload?.pagination?.totalPages ?? 1);
      setTotal(payload?.pagination?.total ?? 0);
    } catch (err) {
      console.error('Failed to load support conversations', err);
      setError('Unable to load AI support conversations.');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [limit, page, search]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const openDetail = async (conv: SupportConversationItem) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const response = await adminApiService.getSupportConversation(conv.id);
      setDetail(response.data?.data ?? null);
    } catch (err) {
      console.error('Failed to load conversation', err);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-7 w-7 text-cyan-400" />
              AI Support Chats
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              User conversations with the in-app AI assistant ({total} sessions)
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchList()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search email, username, session…"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/60">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700 text-sm">
              <thead className="bg-gray-900/40 text-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Session</th>
                  <th className="px-4 py-3 text-left font-semibold">Messages</th>
                  <th className="px-4 py-3 text-left font-semibold">Last source</th>
                  <th className="px-4 py-3 text-left font-semibold">Last activity</th>
                  <th className="px-4 py-3 text-left font-semibold">Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      Loading conversations…
                    </td>
                  </tr>
                ) : conversations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No conversations found.
                    </td>
                  </tr>
                ) : (
                  conversations.map((conv) => (
                    <tr
                      key={conv.id}
                      className="hover:bg-gray-700/40 cursor-pointer"
                      onClick={() => void openDetail(conv)}
                    >
                      <td className="px-4 py-3">
                        <UserCell conv={conv} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[140px] truncate">
                        {conv.sessionId}
                      </td>
                      <td className="px-4 py-3">{conv.messageCount ?? 0}</td>
                      <td className="px-4 py-3 text-gray-400">{conv.lastSource ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {formatDate(conv.lastMessageAt || conv.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[120px]">
                        {conv.currentPath ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] bg-gray-800 border-gray-700 text-white p-0 gap-0 overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700 shrink-0">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5 text-cyan-400" />
                Conversation
                {detail?.userEmail && (
                  <span className="text-sm font-normal text-gray-400">
                    — {detail.userEmail}
                  </span>
                )}
              </DialogTitle>
              {detail?.sessionId && (
                <p className="text-xs text-gray-500 font-mono mt-1">{detail.sessionId}</p>
              )}
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detailLoading ? (
                <p className="text-center text-gray-400 py-8">Loading messages…</p>
              ) : !detail?.messages?.length ? (
                <p className="text-center text-gray-500 py-8">No messages in this session.</p>
              ) : (
                detail.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 border ${
                      msg.role === 'user'
                        ? 'bg-blue-500/10 border-blue-500/30 mr-8'
                        : 'bg-gray-700/40 border-gray-600/40 ml-8'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase text-gray-400">
                        {msg.role === 'user' ? 'User' : 'AI'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(msg.createdAt)}
                        {msg.source ? ` · ${msg.source}` : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-100 whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    {msg.role === 'user' &&
                      msg.effectiveQuestion &&
                      msg.effectiveQuestion !== msg.content && (
                        <p className="text-xs text-gray-500 mt-2 border-t border-gray-600/30 pt-2">
                          Context: {msg.effectiveQuestion}
                        </p>
                      )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
