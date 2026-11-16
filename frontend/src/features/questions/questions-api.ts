import { apiRequest } from '../../lib/api';

export interface Question {
  id: string;
  prompt: string;
  answer: string | null;
  specialties: Array<{ id: string; name: string }>;
  isFavorite: boolean;
  favoriteOrder: number | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveQuestionInput {
  prompt: string;
  answer: string | null;
  specialtyIds: string[];
}

export const questionKeys = {
  all: (companyId: string) => ['companies', companyId, 'questions'] as const,
  detail: (companyId: string, id: string) =>
    ['companies', companyId, 'questions', id] as const,
};

export const lastEditedQuestionStorageKey = (companyId: string) =>
  `companies.${companyId}.last-edited-question`;

export const expandedQuestionsStorageKey = (companyId: string) =>
  `companies.${companyId}.expanded-questions`;

export function readExpandedQuestionIds(companyId: string): Set<string> | null {
  const stored = sessionStorage.getItem(expandedQuestionsStorageKey(companyId));
  if (stored === null) return null;
  try {
    const ids: unknown = JSON.parse(stored);
    return Array.isArray(ids) && ids.every((id) => typeof id === 'string')
      ? new Set(ids)
      : null;
  } catch {
    return null;
  }
}

export function storeExpandedQuestionIds(
  companyId: string,
  ids: Iterable<string>,
): void {
  sessionStorage.setItem(
    expandedQuestionsStorageKey(companyId),
    JSON.stringify([...ids]),
  );
}

const questionsPath = (companyId: string) =>
  `/companies/${companyId}/questions`;

export function getQuestions(companyId: string): Promise<Question[]> {
  return apiRequest<Question[]>(questionsPath(companyId));
}

export function getQuestion(companyId: string, id: string): Promise<Question> {
  return apiRequest<Question>(`${questionsPath(companyId)}/${id}`);
}

export function createQuestion(
  companyId: string,
  input: SaveQuestionInput,
): Promise<Question> {
  return apiRequest<Question>(questionsPath(companyId), {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateQuestion(
  companyId: string,
  id: string,
  input: SaveQuestionInput,
): Promise<Question> {
  return apiRequest<Question>(`${questionsPath(companyId)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function setQuestionFavorite(
  companyId: string,
  id: string,
  isFavorite: boolean,
): Promise<Question> {
  return apiRequest<Question>(`${questionsPath(companyId)}/${id}/favorite`, {
    method: 'PATCH',
    body: JSON.stringify({ isFavorite }),
  });
}

export function reorderFavoriteQuestions(
  companyId: string,
  questionIds: string[],
): Promise<Question[]> {
  return apiRequest<Question[]>(`${questionsPath(companyId)}/favorites/order`, {
    method: 'PATCH',
    body: JSON.stringify({ questionIds }),
  });
}

export function deleteQuestion(companyId: string, id: string): Promise<void> {
  return apiRequest<void>(`${questionsPath(companyId)}/${id}`, {
    method: 'DELETE',
  });
}
