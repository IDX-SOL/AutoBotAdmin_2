'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import emailService from '@/utils/emailService';
import { useToast } from '@/components/Toast/ToastContext';
import { ArrowLeft, Eye, EyeOff, Save } from 'lucide-react';

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 items-center justify-center rounded-md bg-gray-700 text-gray-400">
      Loading editor…
    </div>
  ),
});

const joditConfig = {
  readonly: false,
  height: 420,
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
    'source',
    '|',
    'bold',
    'italic',
    'underline',
    '|',
    'ul',
    'ol',
    '|',
    'outdent',
    'indent',
    '|',
    'font',
    'fontsize',
    'brush',
    '|',
    'paragraph',
    '|',
    'image',
    'table',
    'link',
    '|',
    'align',
    'undo',
    'redo',
    '|',
    'hr',
    'eraser',
    'copyformat',
    '|',
    'symbol',
    'fullsize',
    'print',
    'about',
  ],
  removeButtons: ['brush', 'file'],
  zIndex: 0,
  maxHeight: 520,
  direction: 'ltr' as const,
  language: 'en',
};

export default function EditEmailTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const rawId = params.templateId as string;
  const isNew = rawId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  const numericId = isNew ? NaN : parseInt(rawId, 10);

  const loadExisting = useCallback(async () => {
    if (isNew || Number.isNaN(numericId)) {
      setNotFound(!isNew);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    try {
      const list = await emailService.getTemplates();
      const found = list.find((t) => t.id === numericId);
      if (!found) {
        setNotFound(true);
        return;
      }
      setName(found.name);
      setSubject(found.subject);
      setContent(found.content);
      setEditorContent(found.content);
    } catch (e) {
      console.error(e);
      showError('Failed to load template');
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [isNew, numericId, showError]);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  useEffect(() => {
    setEditorContent(content);
  }, [content]);

  const handleSave = async () => {
    const n = name.trim();
    const s = subject.trim();
    const c = content.trim();

    if (!n || !s || !c) {
      showError('Name, subject, and body are required');
      return;
    }

    const validation = emailService.validateEmailContent(c);
    if (!validation.isValid) {
      showError(validation.errors.join('; '));
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        const templateData = {
          name: n,
          subject: s,
          content: c,
          createdBy: 1,
          isActive: true,
          category: 'custom' as const,
          tags: [] as string[],
          updatedAt: new Date().toISOString(),
        };
        const result = await emailService.saveTemplate(templateData);
        if (result.success && result.templateId != null) {
          showSuccess(result.message);
          router.replace(`/admin/email-templates/${result.templateId}`);
          return;
        }
        showError(result.message);
      } else {
        if (Number.isNaN(numericId)) {
          showError('Invalid template id');
          return;
        }
        const result = await emailService.updateTemplate(numericId, {
          name: n,
          subject: s,
          content: c,
        });
        if (result.success) {
          showSuccess(result.message);
          void loadExisting();
        } else {
          showError(result.message);
        }
      }
    } catch (e) {
      console.error(e);
      showError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && Number.isNaN(numericId)) {
    return (
      <AdminLayout>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          Invalid template URL.
          <Link href="/admin/email-templates" className="ml-2 text-cyan-300 underline">
            Back to list
          </Link>
        </div>
      </AdminLayout>
    );
  }

  if (!loading && notFound) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <p className="text-zinc-300">Template not found.</p>
          <Link
            href="/admin/email-templates"
            className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            All templates
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/email-templates"
              className="rounded-lg border border-white/10 p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Back to templates"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {isNew ? 'New email template' : 'Edit email template'}
              </h1>
              <p className="mt-1 text-sm text-zinc-400">
                Rich HTML stored for reuse when sending or automating email.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Hide preview' : 'Preview'}
            </button>
            <button
              type="button"
              disabled={loading || saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-gray-800 py-20 text-gray-400">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            Loading…
          </div>
        ) : (
          <>
            <div className="space-y-4 rounded-xl border border-gray-700 bg-gray-800 p-6">
              <div>
                <label htmlFor="tpl-name" className="mb-2 block text-sm font-medium text-zinc-300">
                  Name
                </label>
                <input
                  id="tpl-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome email"
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="tpl-subject" className="mb-2 block text-sm font-medium text-zinc-300">
                  Subject
                </label>
                <input
                  id="tpl-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-zinc-300">Body (HTML)</span>
                <div className="overflow-hidden rounded-md border border-gray-600">
                  <JoditEditor
                    ref={editorRef}
                    value={editorContent}
                    config={joditConfig}
                    onBlur={(html) => setContent(html)}
                  />
                </div>
              </div>
            </div>

            {showPreview ? (
              <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                <h2 className="mb-4 text-lg font-semibold text-white">Preview</h2>
                <div className="rounded-lg bg-white p-6 text-gray-900">
                  <h3 className="mb-3 text-xl font-bold">{subject || '(no subject)'}</h3>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: emailService.formatEmailContent(content) || '<p class="text-gray-500">(empty)</p>',
                    }}
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
