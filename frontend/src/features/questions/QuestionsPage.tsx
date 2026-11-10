import { useLayoutEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  deleteQuestion,
  getQuestions,
  lastEditedQuestionStorageKey,
  questionKeys,
  setQuestionFavorite,
} from './questions-api';
import { CompanyGate } from '../companies/CompanyGate';
import { useCompanyContext } from '../companies/CompanyContext';
import { useAuthStore } from '../auth/auth-store';

const MAX_FAVORITE_QUESTIONS = 10;

export function QuestionsPage() {
  return (
    <CompanyGate>
      {(companyId) => <CompanyQuestionsPage companyId={companyId} />}
    </CompanyGate>
  );
}

function CompanyQuestionsPage({ companyId }: { companyId: string }) {
  const { company } = useCompanyContext();
  const user = useAuthStore((state) => state.user);
  const questionListRef = useRef<HTMLUListElement>(null);
  const questionPickerRef = useRef<HTMLDetailsElement>(null);
  const questionToScrollRef = useRef<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(
    () => {
      const lastEditedQuestionId = sessionStorage.getItem(
        lastEditedQuestionStorageKey(companyId),
      );
      return lastEditedQuestionId
        ? new Set([lastEditedQuestionId])
        : new Set();
    },
  );
  const queryClient = useQueryClient();
  const questionsQuery = useQuery({
    queryKey: questionKeys.all(companyId),
    queryFn: () => getQuestions(companyId),
  });
  useLayoutEffect(() => {
    if (!questionsQuery.data) return;

    const lastEditedQuestionId = sessionStorage.getItem(
      lastEditedQuestionStorageKey(companyId),
    );
    const viewportOffsetKey = `${lastEditedQuestionStorageKey(companyId)}.viewport-offset`;
    const savedViewportOffset = sessionStorage.getItem(viewportOffsetKey);
    if (!lastEditedQuestionId || savedViewportOffset === null) return;

    const list = questionListRef.current;
    const questionElement = list?.querySelector<HTMLElement>(
      `[data-question-id="${lastEditedQuestionId}"]`,
    );
    if (!list || !questionElement) return;

    const viewportOffset = Number(savedViewportOffset);
    if (Number.isFinite(viewportOffset)) {
      const currentOffset =
        questionElement.getBoundingClientRect().top -
        list.getBoundingClientRect().top;
      list.scrollTop += currentOffset - viewportOffset;
    }

    sessionStorage.removeItem(viewportOffsetKey);
  }, [companyId, questionsQuery.data]);
  useLayoutEffect(() => {
    const questionId = questionToScrollRef.current;
    if (!questionId) return;

    const list = questionListRef.current;
    const questionElement = list?.querySelector<HTMLElement>(
      `[data-question-id="${questionId}"]`,
    );
    if (list && questionElement) {
      list.scrollTop +=
        questionElement.getBoundingClientRect().top -
        list.getBoundingClientRect().top;
    }
    questionToScrollRef.current = null;
  }, [expandedQuestions]);

  function rememberQuestionPosition(questionId: string) {
    const list = questionListRef.current;
    const questionElement = list?.querySelector<HTMLElement>(
      `[data-question-id="${questionId}"]`,
    );
    if (!list || !questionElement) return;

    const viewportOffset =
      questionElement.getBoundingClientRect().top -
      list.getBoundingClientRect().top;
    sessionStorage.setItem(
      `${lastEditedQuestionStorageKey(companyId)}.viewport-offset`,
      String(viewportOffset),
    );
  }

  function showQuestion(questionId: string) {
    questionPickerRef.current?.removeAttribute('open');
    questionToScrollRef.current = questionId;
    setExpandedQuestions((current) => new Set(current).add(questionId));
  }

  const alphabetizedQuestions = questionsQuery.data
    ? [...questionsQuery.data].sort((a, b) =>
        getQuestionTitle(a.prompt).localeCompare(
          getQuestionTitle(b.prompt),
          'pt-BR',
          { sensitivity: 'base' },
        ),
      )
    : [];
  const orderedQuestions = questionsQuery.data
    ? [...questionsQuery.data].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) {
          return a.isFavorite ? -1 : 1;
        }
        return getQuestionTitle(a.prompt).localeCompare(
          getQuestionTitle(b.prompt),
          'pt-BR',
          { sensitivity: 'base' },
        );
      })
    : [];
  const favoriteCount =
    questionsQuery.data?.filter((question) => question.isFavorite).length ?? 0;
  const allQuestionsExpanded =
    orderedQuestions.length > 0 &&
    orderedQuestions.every((question) => expandedQuestions.has(question.id));
  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      setQuestionFavorite(companyId, id, isFavorite),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: questionKeys.all(companyId),
      }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuestion(companyId, id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: questionKeys.all(companyId),
      }),
  });

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Prática técnica</p>
          <h1 className="page-title">Perguntas — {company?.name}</h1>
          <p className="mt-2 text-slate-400">
            Cadastre e revise suas perguntas de entrevista.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {orderedQuestions.length > 0 && (
            <div className="flex gap-2">
              <button
                className="button-secondary"
                type="button"
                disabled={allQuestionsExpanded}
                onClick={() =>
                  setExpandedQuestions(
                    new Set(orderedQuestions.map((question) => question.id)),
                  )
                }
              >
                Expandir todas
              </button>
              <button
                className="button-secondary"
                type="button"
                disabled={!expandedQuestions.size}
                onClick={() => setExpandedQuestions(new Set())}
              >
                Colapsar todas
              </button>
            </div>
          )}
          {questionsQuery.data && questionsQuery.data.length > 0 && (
            <details
              ref={questionPickerRef}
              className="group relative min-w-56 max-w-xs self-end"
            >
              <summary
                className="field flex cursor-pointer list-none items-center justify-between gap-3 overflow-hidden text-ellipsis whitespace-nowrap py-2"
                aria-label="Selecionar pergunta"
              >
                Selecione uma pergunta…
                <svg
                  className="size-4 shrink-0 transition-transform group-open:rotate-180"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>
              <ul className="question-list-scrollbar absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-xl">
                {alphabetizedQuestions.map((question) => (
                  <li key={question.id}>
                    <button
                      className="block w-full rounded-lg px-3 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white"
                      type="button"
                      onClick={() => showQuestion(question.id)}
                    >
                      {getQuestionTitle(question.prompt)}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
          <Link className="button-primary" to="/questions/new">
            Nova pergunta
          </Link>
        </div>
      </div>

      {questionsQuery.isPending && (
        <p className="panel text-slate-300">Carregando perguntas…</p>
      )}
      {questionsQuery.isError && (
        <p role="alert" className="panel text-red-200">
          Não foi possível carregar as perguntas: {questionsQuery.error.message}
        </p>
      )}
      {deleteMutation.isError && (
        <p role="alert" className="panel text-red-200">
          Não foi possível excluir a pergunta: {deleteMutation.error.message}
        </p>
      )}
      {user && user.role !== 'user' && favoriteMutation.isError && (
        <p role="alert" className="panel text-red-200">
          Não foi possível atualizar os favoritos:{' '}
          {favoriteMutation.error.message}
        </p>
      )}
      {user && user.role !== 'user' && questionsQuery.data && (
        <p className="text-sm text-slate-400">
          Favorites: {favoriteCount}/{MAX_FAVORITE_QUESTIONS} — they stay at the
          top of the list.
        </p>
      )}
      {questionsQuery.data?.length === 0 && (
        <div className="panel grid justify-items-start gap-3">
          <h2 className="text-lg font-semibold">Nenhuma pergunta cadastrada</h2>
          <p className="text-slate-400">
            Crie sua primeira pergunta para começar a montar sua coleção.
          </p>
          <Link className="button-secondary" to="/questions/new">
            Cadastrar pergunta
          </Link>
        </div>
      )}
      {questionsQuery.data && questionsQuery.data.length > 0 && (
        <ul
          ref={questionListRef}
          className="question-list-scrollbar grid min-h-0 flex-1 content-start gap-4 overflow-y-auto overscroll-contain pr-2"
        >
          {orderedQuestions.map((question) => (
            <li
              className="panel grid gap-4"
              data-question-id={question.id}
              key={question.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-slate-100">
                  {getQuestionTitle(question.prompt)}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {user && user.role !== 'user' && (
                    <button
                      className={
                        question.isFavorite
                          ? 'button-secondary border-amber-400/50 text-amber-200'
                          : 'button-secondary'
                      }
                      type="button"
                      aria-pressed={question.isFavorite}
                      aria-label={
                        question.isFavorite
                          ? 'Remove favorite'
                          : 'Add favorite'
                      }
                      title={
                        !question.isFavorite &&
                        favoriteCount >= MAX_FAVORITE_QUESTIONS
                          ? `The ${MAX_FAVORITE_QUESTIONS}-favorite limit has been reached`
                          : undefined
                      }
                      disabled={
                        favoriteMutation.isPending ||
                        (!question.isFavorite &&
                          favoriteCount >= MAX_FAVORITE_QUESTIONS)
                      }
                      onClick={() =>
                        favoriteMutation.mutate({
                          id: question.id,
                          isFavorite: !question.isFavorite,
                        })
                      }
                    >
                      <span aria-hidden="true">
                        {question.isFavorite ? '★' : '☆'}
                      </span>
                      {question.isFavorite ? 'Favorite' : 'Add favorite'}
                    </button>
                  )}
                  <button
                    className="button-secondary"
                    type="button"
                    aria-expanded={expandedQuestions.has(question.id)}
                    aria-controls={`question-details-${question.id}`}
                    onClick={(event) => {
                      const isExpanded = expandedQuestions.has(question.id);
                      setExpandedQuestions((current) => {
                        const next = new Set(current);
                        if (next.has(question.id)) {
                          next.delete(question.id);
                        } else {
                          next.add(question.id);
                        }
                        return next;
                      });
                      if (!isExpanded) {
                        const questionElement = event.currentTarget.closest(
                          '[data-question-id]',
                        );
                        requestAnimationFrame(() => {
                          const list = questionListRef.current;
                          if (!list || !questionElement) return;
                          list.scrollTop +=
                            questionElement.getBoundingClientRect().top -
                            list.getBoundingClientRect().top;
                        });
                      }
                    }}
                  >
                    {expandedQuestions.has(question.id)
                      ? 'Recolher'
                      : 'Expandir'}
                  </button>
                </div>
              </div>
              <div
                id={`question-details-${question.id}`}
                hidden={!expandedQuestions.has(question.id)}
                className="grid gap-4"
              >
                <div className="grid gap-2">
                  <p className="whitespace-pre-wrap text-slate-100">
                    {question.prompt}
                  </p>
                  {question.answer && (
                    <div className="whitespace-pre-wrap text-sm leading-6 text-slate-400">
                      {renderAnswer(question.answer)}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 border-t border-slate-800 pt-4">
                  {(user?.role === 'root' ||
                    user?.role === 'master' ||
                    question.createdById === user?.id) && (
                    <>
                      <Link
                        className="button-secondary"
                        to="/questions/$questionId/edit"
                        params={{ questionId: question.id }}
                        onClick={() => rememberQuestionPosition(question.id)}
                      >
                        Editar
                      </Link>
                      <button
                        className="button-danger"
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Excluir a pergunta "${getQuestionTitle(question.prompt)}"?`,
                            )
                          ) {
                            deleteMutation.mutate(question.id);
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getQuestionTitle(prompt: string): string {
  const title = prompt.split(/\r?\n/, 1)[0]?.trim() || 'Pergunta sem título';
  return title.length > 80 ? `${title.slice(0, 77).trimEnd()}…` : title;
}

function renderAnswer(answer: string) {
  const parts: React.ReactNode[] = [];
  const codePattern = /```([\s\S]*?)```|`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = codePattern.exec(answer)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key}>{answer.slice(lastIndex, match.index)}</span>,
      );
      key += 1;
    }
    const code = match[1] ?? match[2];
    if (code.includes('\n')) {
      parts.push(
        <pre
          className="my-2 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-sm text-sky-200"
          key={key}
        >
          <code>{code.trim()}</code>
        </pre>,
      );
    } else {
      parts.push(
        <code
          className="rounded bg-slate-950 px-1.5 py-0.5 font-mono text-sky-200"
          key={key}
        >
          {code}
        </code>,
      );
    }
    lastIndex = match.index + match[0].length;
    key += 1;
  }

  if (lastIndex < answer.length) {
    parts.push(<span key={key}>{answer.slice(lastIndex)}</span>);
  }

  return parts;
}
