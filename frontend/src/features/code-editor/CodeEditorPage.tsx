import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { EditorView } from '@codemirror/view';
import { useMemo } from 'react';
import { CompanyGate } from '../companies/CompanyGate';
import { useCompanyContext } from '../companies/CompanyContext';
import { useEditorStore } from '../../stores/editor-store';
import {
  codeSnippetKeys,
  createCodeSnippet,
  deleteCodeSnippet,
  getCodeSnippets,
  runCode,
  updateCodeSnippet,
  type CodeLanguage,
  type SaveCodeSnippetInput,
} from './code-api';

const AUTO_SAVE_INTERVAL_MS = 5 * 60 * 1000;

interface EditorSnapshot {
  title: string;
  language: CodeLanguage;
  source: string;
  activeSnippetId: string | null;
  sessionId: number;
}

interface SaveCodeRequest {
  id: string | null;
  input: SaveCodeSnippetInput;
  snapshot: EditorSnapshot;
}

export function CodeEditorPage() {
  return (
    <CompanyGate>
      {(companyId) => (
        <CompanyCodeEditor key={companyId} companyId={companyId} />
      )}
    </CompanyGate>
  );
}

function CompanyCodeEditor({ companyId }: { companyId: string }) {
  const { company } = useCompanyContext();
  const queryClient = useQueryClient();
  const language = useEditorStore(
    (state) => state.drafts[companyId]?.language ?? 'python',
  );
  const source = useEditorStore(
    (state) => state.drafts[companyId]?.source ?? '',
  );
  const setLanguage = useEditorStore((state) => state.setLanguage);
  const setSource = useEditorStore((state) => state.setSource);
  const [title, setTitle] = useState('');
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const [copied, setCopied] = useState(false);
  const sessionIdRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const savedSnapshotRef = useRef<EditorSnapshot | null>(null);
  const editorSnapshotRef = useRef<EditorSnapshot>({
    title,
    language,
    source,
    activeSnippetId,
    sessionId: sessionIdRef.current,
  });
  editorSnapshotRef.current = {
    title,
    language,
    source,
    activeSnippetId,
    sessionId: sessionIdRef.current,
  };
  const snippetsQuery = useQuery({
    queryKey: codeSnippetKeys.all(companyId),
    queryFn: () => getCodeSnippets(companyId),
  });
  const runMutation = useMutation({
    mutationFn: (input: { language: CodeLanguage; source: string }) =>
      runCode(companyId, input),
  });
  const copyMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!navigator.clipboard) {
        throw new Error(
          'Clipboard access is not available in this browser.',
        );
      }
      await navigator.clipboard.writeText(code);
    },
    onSuccess: () => setCopied(true),
  });
  const saveMutation = useMutation({
    mutationFn: (request: SaveCodeRequest) =>
      request.id
        ? updateCodeSnippet(companyId, request.id, request.input)
        : createCodeSnippet(companyId, request.input),
    onSuccess: async (snippet, request) => {
      markSnippetSaved(snippet, request);
      await queryClient.invalidateQueries({
        queryKey: codeSnippetKeys.all(companyId),
      });
    },
    onSettled: () => {
      saveInFlightRef.current = false;
    },
  });
  const autoSaveMutation = useMutation({
    mutationFn: (request: SaveCodeRequest) =>
      request.id
        ? updateCodeSnippet(companyId, request.id, request.input)
        : createCodeSnippet(companyId, request.input),
    onSuccess: async (snippet, request) => {
      markSnippetSaved(snippet, request);
      await queryClient.invalidateQueries({
        queryKey: codeSnippetKeys.all(companyId),
      });
    },
    onError: (error) => {
      console.error('Failed to automatically save the code snippet:', error);
    },
    onSettled: () => {
      saveInFlightRef.current = false;
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCodeSnippet(companyId, id),
    onSuccess: async (_result, id) => {
      if (activeSnippetId === id) {
        startNewSnippet();
      }
      await queryClient.invalidateQueries({
        queryKey: codeSnippetKeys.all(companyId),
      });
    },
  });
  const extensions = useMemo(
    () => [
      language === 'python' ? python() : javascript(),
      EditorView.lineWrapping,
    ],
    [language],
  );
  const sourceByteLength = new TextEncoder().encode(source).length;

  function markSnippetSaved(
    snippet: { id: string; title: string },
    request: SaveCodeRequest,
  ) {
    if (sessionIdRef.current === request.snapshot.sessionId) {
      savedSnapshotRef.current = {
        ...request.snapshot,
        title: request.input.title,
        activeSnippetId: snippet.id,
      };
      editorSnapshotRef.current = {
        ...editorSnapshotRef.current,
        activeSnippetId: snippet.id,
      };
      setActiveSnippetId(snippet.id);
      if (editorSnapshotRef.current.title.trim() === request.input.title) {
        setTitle(snippet.title);
      }
    }
  }

  function startNewSnippet() {
    sessionIdRef.current += 1;
    savedSnapshotRef.current = null;
    editorSnapshotRef.current = {
      title: '',
      language: 'python',
      source: '',
      activeSnippetId: null,
      sessionId: sessionIdRef.current,
    };
    setActiveSnippetId(null);
    setTitle('');
    setLanguage(companyId, 'python');
    setSource(companyId, '');
    setValidationError('');
    setCopied(false);
    runMutation.reset();
    copyMutation.reset();
    saveMutation.reset();
  }

  function saveSnippet() {
    if (!title.trim()) {
      setValidationError('Enter a name for the code snippet.');
      return;
    }
    if (!source.trim()) {
      setValidationError('The code cannot be empty.');
      return;
    }
    if (sourceByteLength > 20_000) {
      setValidationError('The code must be no larger than 20,000 bytes.');
      return;
    }
    setValidationError('');
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    saveMutation.mutate({
      id: activeSnippetId,
      input: { title: title.trim(), language, source },
      snapshot: editorSnapshotRef.current,
    });
  }

  function openSnippet(snippet: {
    id: string;
    title: string;
    language: CodeLanguage;
    source: string;
  }) {
    sessionIdRef.current += 1;
    const snapshot: EditorSnapshot = {
      title: snippet.title,
      language: snippet.language,
      source: snippet.source,
      activeSnippetId: snippet.id,
      sessionId: sessionIdRef.current,
    };
    editorSnapshotRef.current = snapshot;
    savedSnapshotRef.current = snapshot;
    setActiveSnippetId(snippet.id);
    setTitle(snippet.title);
    setLanguage(companyId, snippet.language);
    setSource(companyId, snippet.source);
    setValidationError('');
    setCopied(false);
    runMutation.reset();
    copyMutation.reset();
    saveMutation.reset();
  }

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const snapshot = editorSnapshotRef.current;
      const normalizedTitle = snapshot.title.trim();
      const byteLength = new TextEncoder().encode(snapshot.source).length;
      const savedSnapshot = savedSnapshotRef.current;
      const hasChanges =
        !savedSnapshot ||
        savedSnapshot.sessionId !== snapshot.sessionId ||
        savedSnapshot.title !== normalizedTitle ||
        savedSnapshot.language !== snapshot.language ||
        savedSnapshot.source !== snapshot.source;

      if (
        saveInFlightRef.current ||
        !normalizedTitle ||
        !snapshot.source.trim() ||
        byteLength > 20_000 ||
        !hasChanges
      ) {
        return;
      }

      saveInFlightRef.current = true;
      autoSaveMutation.mutate({
        id: snapshot.activeSnippetId,
        input: {
          title: normalizedTitle,
          language: snapshot.language,
          source: snapshot.source,
        },
        snapshot,
      });
    }, AUTO_SAVE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [autoSaveMutation.mutate]);

  return (
    <section className="grid gap-6">
      <div>
        <p className="eyebrow">Local execution · {company?.name}</p>
        <h1 className="page-title">Code Editor</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Save Python or Node.js examples for the selected company and run them
          with the local code runner.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="panel grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Snippet name
            <input
              className="field"
              maxLength={120}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setValidationError('');
              }}
              placeholder="e.g. Reverse a string"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-200">
              Language
              <select
                className="field w-auto"
                value={language}
                onChange={(event) => {
                  const nextLanguage = event.target.value;
                  if (nextLanguage === 'python' || nextLanguage === 'node') {
                    setLanguage(companyId, nextLanguage);
                    runMutation.reset();
                  }
                }}
              >
                <option value="python">Python</option>
                <option value="node">Node.js</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                className="button-secondary"
                type="button"
                onClick={startNewSnippet}
              >
                New
              </button>
              <button
                className="button-secondary"
                type="button"
                disabled={copyMutation.isPending || source.length === 0}
                onClick={() => {
                  setCopied(false);
                  copyMutation.mutate(source);
                }}
              >
                {copyMutation.isPending
                  ? 'Copying…'
                  : copied
                    ? 'Copied!'
                    : 'Copy code'}
              </button>
              <button
                className="button-secondary"
                type="button"
                disabled={saveMutation.isPending || autoSaveMutation.isPending}
                onClick={saveSnippet}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save code'}
              </button>
              <button
                className="button-primary"
                type="button"
                disabled={
                  runMutation.isPending ||
                  source.trim().length === 0 ||
                  sourceByteLength > 20_000
                }
                onClick={() => runMutation.mutate({ language, source })}
              >
                {runMutation.isPending ? 'Running…' : 'Run'}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-700">
            <CodeMirror
              value={source}
              onChange={(value) => {
                setSource(companyId, value);
                runMutation.reset();
                copyMutation.reset();
                setCopied(false);
              }}
              extensions={extensions}
              height="360px"
              theme="dark"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                autocompletion: true,
                bracketMatching: true,
                closeBrackets: true,
              }}
              aria-label={`${language === 'python' ? 'Python' : 'Node.js'} editor`}
            />
          </div>
          <p className="text-right text-xs text-slate-500">
            {sourceByteLength.toLocaleString('en-US')} / 20,000 bytes
          </p>

          {validationError && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
            >
              {validationError}
            </p>
          )}
          {saveMutation.isError && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
            >
              Failed to save the code: {saveMutation.error.message}
            </p>
          )}
          {copyMutation.isError && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
            >
              Failed to copy the code: {copyMutation.error.message}
            </p>
          )}
          {copied && (
            <p role="status" className="text-sm text-sky-300">
              Code copied to the clipboard.
            </p>
          )}
          {deleteMutation.isError && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
            >
              Failed to delete the code: {deleteMutation.error.message}
            </p>
          )}
          {runMutation.isError && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
            >
              Failed to run the code: {runMutation.error.message}
            </p>
          )}

          {runMutation.data && (
            <section aria-live="polite" className="grid gap-4">
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
                <span>
                  Exit code:{' '}
                  <strong className="text-slate-100">
                    {runMutation.data.exitCode ?? 'terminated'}
                  </strong>
                </span>
                <span>
                  Duration:{' '}
                  <strong className="text-slate-100">
                    {runMutation.data.durationMs} ms
                  </strong>
                </span>
                {runMutation.data.timedOut && (
                  <strong className="text-amber-300">
                    Timed out
                  </strong>
                )}
                {runMutation.data.outputTruncated && (
                  <strong className="text-amber-300">
                    Output truncated due to size limit
                  </strong>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <OutputPanel
                  label="Standard output (stdout)"
                  value={runMutation.data.stdout}
                />
                <OutputPanel
                  label="Errors (stderr)"
                  value={runMutation.data.stderr}
                />
              </div>
            </section>
          )}
        </div>

        <aside className="panel grid content-start gap-4">
          <div>
            <h2 className="text-lg font-semibold">Saved code snippets</h2>
            <p className="mt-1 text-sm text-slate-400">
              Saved for {company?.name}.
            </p>
          </div>
          {snippetsQuery.isPending && (
            <p className="text-sm text-slate-400">Loading code snippets…</p>
          )}
          {snippetsQuery.isError && (
            <p role="alert" className="text-sm text-red-200">
              Failed to load code snippets:{' '}
              {snippetsQuery.error.message}
            </p>
          )}
          {snippetsQuery.data?.length === 0 && (
            <p className="text-sm text-slate-400">
              No code snippets saved for this company.
            </p>
          )}
          {snippetsQuery.data && snippetsQuery.data.length > 0 && (
            <ul className="question-list-scrollbar grid max-h-96 gap-2 overflow-y-auto overscroll-contain pr-2">
              {snippetsQuery.data.map((snippet) => (
                <li className="flex items-center gap-2" key={snippet.id}>
                  <button
                    className={`min-w-0 flex-1 truncate rounded-lg border px-3 py-2 text-left text-sm ${
                      activeSnippetId === snippet.id
                        ? 'border-sky-400 bg-sky-400/10 text-white'
                        : 'border-slate-700 bg-slate-950 text-slate-300'
                    }`}
                    type="button"
                    onClick={() => openSnippet(snippet)}
                  >
                    <span className="block truncate font-medium">
                      {snippet.title}
                    </span>
                    <span className="text-xs text-slate-500">
                      {snippet.language === 'python' ? 'Python' : 'Node.js'}
                    </span>
                  </button>
                  <button
                    className="button-danger px-2"
                    type="button"
                    aria-label={`Delete ${snippet.title}`}
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete the code snippet "${snippet.title}"?`,
                        )
                      ) {
                        deleteMutation.mutate(snippet.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}

function OutputPanel({ label, value }: { label: string; value: string }) {
  return (
    <section className="grid min-w-0 gap-2">
      <h2 className="text-sm font-medium text-slate-300">{label}</h2>
      <pre className="min-h-24 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-sm text-slate-200">
        {value || 'No output.'}
      </pre>
    </section>
  );
}
