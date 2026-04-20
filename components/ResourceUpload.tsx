/**
 * ResourceUpload.tsx
 * ──────────────────────────────────────────────────────────
 * A self-contained "Study Resources" panel for any subject.
 *
 * What it does:
 *  • Lets students upload PDF / DOC / PPTX files → Firebase Storage
 *  • Lets students save YouTube / web links directly
 *  • Saves metadata (title, type, url, uploadedAt) to Firestore
 *    sub-collection: subjects/{subjectId}/resources
 *  • Reads & displays existing resources in a clean list
 *
 * Props:
 *  subjectId  – the unique ID of the current subject (string)
 *  subjectName – shown in the empty-state message (optional)
 * ──────────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

// ── Types ──────────────────────────────────────────────────

/** Shape of a resource document stored in Firestore */
interface Resource {
  id: string;          // Firestore document ID
  title: string;       // User-provided or filename
  type: 'file' | 'link';
  url: string;         // Storage download URL or user-provided link
  storagePath?: string; // Only for files – needed for deletion
  uploadedAt: Timestamp | null;
}

// ── Props ──────────────────────────────────────────────────

interface ResourceUploadProps {
  subjectId: string;
  subjectName?: string;
}

// ── Helpers ────────────────────────────────────────────────

/** Returns a friendly file-size string, e.g. "2.4 MB" */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Strips tracking params and shows just the domain of a URL */
function prettyUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/** Decide which emoji icon to show for a file type */
function fileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['pdf'].includes(ext))              return '📄';
  if (['doc', 'docx'].includes(ext))      return '📝';
  if (['ppt', 'pptx'].includes(ext))      return '📊';
  if (['xls', 'xlsx'].includes(ext))      return '📈';
  if (['zip', 'rar'].includes(ext))       return '🗜️';
  if (['png','jpg','jpeg','gif'].includes(ext)) return '🖼️';
  return '📎';
}

/** Allowed MIME types for the file picker */
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const MAX_SIZE_MB = 20;

// ── Component ──────────────────────────────────────────────

export default function ResourceUpload({ subjectId, subjectName }: ResourceUploadProps) {

  // ── Tab state: 'file' or 'link' ───────────────────────────
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');

  // ── File upload state ─────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [fileError, setFileError]         = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // 0-100 or null

  // ── Link state ────────────────────────────────────────────
  const [linkUrl, setLinkUrl]    = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkError, setLinkError] = useState('');

  // ── Shared state ──────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Resources list from Firestore ─────────────────────────
  const [resources, setResources]   = useState<Resource[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [deletingId, setDeletingId]  = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // Real-time listener: fetch resources sub-collection
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!subjectId) return;

    // Path: Firestore → subjects/{subjectId}/resources
    const resourcesRef = collection(db, 'subjects', subjectId, 'resources');
    const q = query(resourcesRef, orderBy('uploadedAt', 'desc'));

    // onSnapshot fires immediately and on every future change
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Resource[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Resource, 'id'>),
      }));
      setResources(list);
      setLoadingList(false);
    }, (err) => {
      console.error('Error fetching resources:', err);
      setLoadingList(false);
    });

    // Cleanup listener when component unmounts or subjectId changes
    return () => unsubscribe();
  }, [subjectId]);

  // ─────────────────────────────────────────────────────────
  // File picker validation
  // ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    setSelectedFile(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Only PDF, Word, PowerPoint, or Excel files are allowed.');
      return;
    }
    // Check file size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`File is too large. Maximum size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setSelectedFile(file);
  };

  // ─────────────────────────────────────────────────────────
  // Upload file → Firebase Storage → save metadata to Firestore
  // ─────────────────────────────────────────────────────────
  const handleFileUpload = () => {
    if (!selectedFile || !subjectId) return;
    setSubmitting(true);
    setUploadProgress(0);
    setSuccessMsg('');

    // Storage path: subjects/{subjectId}/resources/{filename}
    const filePath = `subjects/${subjectId}/resources/${Date.now()}_${selectedFile.name}`;
    const fileRef  = storageRef(storage, filePath);

    // uploadBytesResumable lets us track progress
    const uploadTask = uploadBytesResumable(fileRef, selectedFile);

    uploadTask.on(
      'state_changed',

      // ① Progress callback
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(pct);
      },

      // ② Error callback
      (err) => {
        console.error('Upload error:', err);
        setFileError('Upload failed. Check Firebase Storage rules and try again.');
        setSubmitting(false);
        setUploadProgress(null);
      },

      // ③ Success callback (upload complete)
      async () => {
        try {
          // Get the public download URL from Storage
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore sub-collection
          const resourcesRef = collection(db, 'subjects', subjectId, 'resources');
          await addDoc(resourcesRef, {
            title:       selectedFile.name,
            type:        'file',
            url:         downloadURL,
            storagePath: filePath,
            uploadedAt:  serverTimestamp(),
          });

          // Reset state
          setSelectedFile(null);
          setUploadProgress(null);
          setSubmitting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          showSuccess('File uploaded successfully! 🎉');
        } catch (err) {
          console.error('Firestore save error:', err);
          setFileError('File uploaded but could not save metadata. Try again.');
          setSubmitting(false);
          setUploadProgress(null);
        }
      }
    );
  };

  // ─────────────────────────────────────────────────────────
  // Save link → Firestore only (no Storage needed)
  // ─────────────────────────────────────────────────────────
  const handleLinkSave = async () => {
    setLinkError('');
    const trimmedUrl   = linkUrl.trim();
    const trimmedTitle = linkTitle.trim();

    // Basic validation
    if (!trimmedUrl) { setLinkError('Please enter a URL.'); return; }
    try { new URL(trimmedUrl); } catch {
      setLinkError('Please enter a valid URL (starting with https://).'); return;
    }

    setSubmitting(true);
    setSuccessMsg('');

    try {
      const resourcesRef = collection(db, 'subjects', subjectId, 'resources');
      await addDoc(resourcesRef, {
        title:      trimmedTitle || trimmedUrl,   // use URL as title if user left it blank
        type:       'link',
        url:        trimmedUrl,
        uploadedAt: serverTimestamp(),
      });

      // Reset
      setLinkUrl('');
      setLinkTitle('');
      setSubmitting(false);
      showSuccess('Link saved! 🔗');
    } catch (err) {
      console.error('Link save error:', err);
      setLinkError('Could not save link. Check Firestore rules and try again.');
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Delete a resource (from both Firestore and Storage if a file)
  // ─────────────────────────────────────────────────────────
  const handleDelete = async (resource: Resource) => {
    if (!window.confirm(`Delete "${resource.title}"?`)) return;
    setDeletingId(resource.id);
    try {
      // If it's a file, also remove it from Storage
      if (resource.type === 'file' && resource.storagePath) {
        const fileRef = storageRef(storage, resource.storagePath);
        await deleteObject(fileRef).catch(() => {
          // File might already be deleted — not fatal, continue
        });
      }
      // Always remove the Firestore document
      await deleteDoc(doc(db, 'subjects', subjectId, 'resources', resource.id));
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────
  /** Show a green success message for 3 seconds then clear it */
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <section className="mt-10">

      {/* ── Section heading ── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base shadow-md">
          📂
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-none">Study Resources</h2>
          <p className="text-slate-500 text-xs mt-0.5">Upload files or save links for {subjectName ?? 'this subject'}</p>
        </div>
      </div>

      {/* ── Upload card ── */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden mb-6">

        {/* ── Tab bar: File | Link ── */}
        <div className="flex border-b border-white/5">
          {/* File tab */}
          <button
            id="resource-tab-file"
            onClick={() => { setActiveTab('file'); setFileError(''); setLinkError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'file'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📎 Upload File
          </button>

          {/* Link tab */}
          <button
            id="resource-tab-link"
            onClick={() => { setActiveTab('link'); setFileError(''); setLinkError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'link'
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔗 Add Link
          </button>
        </div>

        {/* ── Panel content ── */}
        <div className="p-5">

          {/* ── FILE TAB ── */}
          {activeTab === 'file' && (
            <div className="space-y-4 animate-fade-up">

              {/* Drag-style file picker area */}
              <label
                htmlFor="resource-file-input"
                className={`flex flex-col items-center justify-center gap-3 w-full py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                  selectedFile
                    ? 'border-indigo-500/60 bg-indigo-500/5'
                    : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/5'
                }`}
              >
                {selectedFile ? (
                  <>
                    <span className="text-3xl">{fileIcon(selectedFile.name)}</span>
                    <div className="text-center">
                      <p className="text-white text-sm font-semibold">{selectedFile.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{formatBytes(selectedFile.size)}</p>
                    </div>
                    <p className="text-indigo-400 text-xs underline">Click to change file</p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">☁️</span>
                    <div className="text-center">
                      <p className="text-slate-300 text-sm font-medium">Click to choose a file</p>
                      <p className="text-slate-500 text-xs mt-1">PDF, Word, PowerPoint, Excel · Max {MAX_SIZE_MB} MB</p>
                    </div>
                  </>
                )}
              </label>

              {/* Hidden real file input */}
              <input
                id="resource-file-input"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload progress bar */}
              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Uploading…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {fileError && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <span>⚠️</span>{fileError}
                </p>
              )}

              {/* Upload button */}
              <button
                id="resource-upload-btn"
                onClick={handleFileUpload}
                disabled={!selectedFile || submitting}
                className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <> ☁️ Upload File </>
                )}
              </button>
            </div>
          )}

          {/* ── LINK TAB ── */}
          {activeTab === 'link' && (
            <div className="space-y-3 animate-fade-up">

              {/* YouTube hint */}
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white/5 rounded-lg px-3 py-2">
                <span>💡</span>
                <span>Paste any URL – YouTube lectures, Google Docs, articles, etc.</span>
              </div>

              {/* Title input */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Title <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  id="resource-link-title"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  placeholder="e.g. Binary Trees – YouTube Lecture"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                  maxLength={120}
                />
              </div>

              {/* URL input */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  URL <span className="text-red-400">*</span>
                </label>
                <input
                  id="resource-link-url"
                  value={linkUrl}
                  onChange={e => { setLinkUrl(e.target.value); setLinkError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleLinkSave(); }}
                  placeholder="https://youtube.com/watch?v=..."
                  type="url"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Error */}
              {linkError && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <span>⚠️</span>{linkError}
                </p>
              )}

              {/* Save button */}
              <button
                id="resource-link-save-btn"
                onClick={handleLinkSave}
                disabled={!linkUrl.trim() || submitting}
                className="w-full btn-primary text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <> 🔗 Save Link </>
                )}
              </button>
            </div>
          )}

          {/* ── Success toast (shared) ── */}
          {successMsg && (
            <div className="mt-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-2.5 rounded-xl animate-fade-up">
              <span>✅</span>
              {successMsg}
            </div>
          )}
        </div>
      </div>

      {/* ── Resources list ── */}
      <div>
        <h3 className="text-slate-300 font-semibold text-sm mb-3">
          Saved Resources{' '}
          {resources.length > 0 && (
            <span className="text-indigo-400 font-bold">({resources.length})</span>
          )}
        </h3>

        {/* Loading skeleton */}
        {loadingList && (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="glass-card rounded-xl h-14 border border-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingList && resources.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center border border-white/5">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-slate-400 text-sm">
              No resources yet. Upload a file or add a link above!
            </p>
          </div>
        )}

        {/* Resource items */}
        {!loadingList && resources.length > 0 && (
          <div className="space-y-2">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 border border-white/5 hover:border-indigo-500/20 transition-all duration-200 group"
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                  resource.type === 'link'
                    ? 'bg-sky-500/15 text-sky-300'
                    : 'bg-indigo-500/15 text-indigo-300'
                }`}>
                  {resource.type === 'link' ? '🔗' : fileIcon(resource.title)}
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{resource.title}</p>
                  <p className="text-slate-500 text-xs">
                    {resource.type === 'file' ? 'File' : prettyUrl(resource.url)}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Open / Download */}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={resource.type === 'link' ? 'Open link' : 'Download file'}
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-400 flex items-center justify-center text-sm transition-all"
                  >
                    {resource.type === 'link' ? '↗' : '⬇'}
                  </a>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(resource)}
                    disabled={deletingId === resource.id}
                    title="Delete resource"
                    className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center text-sm transition-all disabled:opacity-40"
                  >
                    {deletingId === resource.id ? (
                      <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
