import { create } from 'zustand';
import type { CodeLanguage } from '../features/code-editor/code-api';

interface EditorState {
  drafts: Record<string, { language: CodeLanguage; source: string }>;
  setLanguage: (companyId: string, language: CodeLanguage) => void;
  setSource: (companyId: string, source: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  drafts: {},
  setLanguage: (companyId, language) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [companyId]: {
          language,
          source: state.drafts[companyId]?.source ?? '',
        },
      },
    })),
  setSource: (companyId, source) =>
    set((state) => ({
      drafts: {
        ...state.drafts,
        [companyId]: {
          language: state.drafts[companyId]?.language ?? 'python',
          source,
        },
      },
    })),
}));
