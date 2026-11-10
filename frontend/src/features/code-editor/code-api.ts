import { apiRequest } from '../../lib/api';

export type CodeLanguage = 'python' | 'node';

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  outputTruncated: boolean;
  durationMs: number;
}

export interface CodeSnippet {
  id: string;
  companyId: string;
  title: string;
  language: CodeLanguage;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveCodeSnippetInput {
  title: string;
  language: CodeLanguage;
  source: string;
}

export const codeSnippetKeys = {
  all: (companyId: string) =>
    ['companies', companyId, 'code-snippets'] as const,
};

const companyCodePath = (companyId: string) => `/companies/${companyId}/code`;
const snippetsPath = (companyId: string) =>
  `/companies/${companyId}/code-snippets`;

export function getCodeSnippets(companyId: string): Promise<CodeSnippet[]> {
  return apiRequest<CodeSnippet[]>(snippetsPath(companyId));
}

export function createCodeSnippet(
  companyId: string,
  input: SaveCodeSnippetInput,
): Promise<CodeSnippet> {
  return apiRequest<CodeSnippet>(snippetsPath(companyId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCodeSnippet(
  companyId: string,
  id: string,
  input: SaveCodeSnippetInput,
): Promise<CodeSnippet> {
  return apiRequest<CodeSnippet>(`${snippetsPath(companyId)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCodeSnippet(
  companyId: string,
  id: string,
): Promise<void> {
  return apiRequest<void>(`${snippetsPath(companyId)}/${id}`, {
    method: 'DELETE',
  });
}

export function runCode(
  companyId: string,
  input: {
    language: CodeLanguage;
    source: string;
  },
): Promise<CodeExecutionResult> {
  return apiRequest<CodeExecutionResult>(`${companyCodePath(companyId)}/run`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
