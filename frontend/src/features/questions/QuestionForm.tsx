import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link } from '@tanstack/react-router';
import type { SaveQuestionInput } from './questions-api';

type TextareaChangeHandler = (value: string) => void;

function formatBulletMarkers(value: string): string {
  return value.replace(/^([ \t]*)- +/gm, '$1• ');
}

interface QuestionFormProps {
  initialPrompt?: string;
  initialAnswer?: string | null;
  submitLabel: string;
  isPending: boolean;
  error?: string;
  onSubmit: (input: SaveQuestionInput) => void;
}

export function QuestionForm({
  initialPrompt = '',
  initialAnswer = '',
  submitLabel,
  isPending,
  error,
  onSubmit,
}: QuestionFormProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [answer, setAnswer] = useState(initialAnswer ?? '');
  const [validationError, setValidationError] = useState('');

  function handleListKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    setValue: TextareaChangeHandler,
  ) {
    if (event.key !== 'Enter') return;

    const textarea = event.currentTarget;
    if (textarea.selectionStart !== textarea.selectionEnd) return;

    const currentValue = textarea.value;
    const cursor = textarea.selectionStart;
    const lineStart = currentValue.lastIndexOf('\n', cursor - 1) + 1;
    const lineEndIndex = currentValue.indexOf('\n', cursor);
    const lineEnd =
      lineEndIndex === -1 ? currentValue.length : lineEndIndex;
    if (cursor !== lineEnd) return;

    const currentLine = currentValue.slice(lineStart, cursor);
    const listItem = currentLine.match(/^(\s*)•\s+(.*)$/);
    const emptyListItem = currentLine.match(/^(\s*)•\s*$/);

    if (listItem && listItem[2].trim()) {
      event.preventDefault();
      const insertion = `\n${listItem[1]}• `;
      setValue(
        `${currentValue.slice(0, cursor)}${insertion}${currentValue.slice(cursor)}`,
      );
      requestAnimationFrame(() => {
        textarea.selectionStart = cursor + insertion.length;
        textarea.selectionEnd = cursor + insertion.length;
      });
      return;
    }

    if (emptyListItem) {
      event.preventDefault();
      const indentation = emptyListItem[1];
      const insertion = `${indentation}\n`;
      setValue(
        `${currentValue.slice(0, lineStart)}${insertion}${currentValue.slice(cursor)}`,
      );
      requestAnimationFrame(() => {
        const nextCursor = lineStart + insertion.length;
        textarea.selectionStart = nextCursor;
        textarea.selectionEnd = nextCursor;
      });
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) {
      setValidationError('O enunciado é obrigatório.');
      return;
    }
    setValidationError('');
    onSubmit({
      prompt: prompt.trim(),
      answer: answer.trim() || null,
    });
  }

  function handleAnswerChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget;
    const value = textarea.value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;
    const formattedValue = formatBulletMarkers(value);
    if (formattedValue === value) {
      setAnswer(value);
      return;
    }

    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEndIndex = value.indexOf('\n', selectionStart);
    const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const currentLine = value.slice(lineStart, lineEnd);
    const bulletMarker = currentLine.match(/^([ \t]*)- +/);
    const shouldMoveToLineEnd =
      selectionStart === selectionEnd &&
      bulletMarker !== null &&
      selectionStart === lineStart + bulletMarker[0].length;

    setAnswer(formattedValue);
    requestAnimationFrame(() => {
      const start = shouldMoveToLineEnd
        ? formatBulletMarkers(value.slice(0, lineStart)).length +
          formatBulletMarkers(currentLine).length
        : formatBulletMarkers(value.slice(0, selectionStart)).length;
      const end = shouldMoveToLineEnd
        ? start
        : formatBulletMarkers(value.slice(0, selectionEnd)).length;
      textarea.setSelectionRange(start, end);
      textarea.scrollTop = scrollTop;
      textarea.scrollLeft = scrollLeft;
    });
  }

  return (
    <form className="panel grid gap-5" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-slate-200">
        Enunciado
        <input
          required
          autoFocus
          maxLength={10_000}
          value={prompt}
          onChange={(event) => {
            setPrompt(event.target.value);
            setValidationError('');
          }}
          placeholder="Escreva a pergunta da entrevista"
          className="field h-12"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-200">
        Resposta ou explicação{' '}
        <span className="text-slate-500">(opcional)</span>
        <textarea
          maxLength={20_000}
          rows={5}
          value={answer}
          onChange={handleAnswerChange}
          onKeyDown={(event) => handleListKeyDown(event, setAnswer)}
          placeholder="Adicione uma resposta ou explicação, se desejar"
          className="field min-h-32 resize-y"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}
      {validationError && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200"
        >
          {validationError}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button className="button-primary" type="submit" disabled={isPending}>
          {isPending ? 'Salvando…' : submitLabel}
        </button>
        <Link className="button-secondary" to="/">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
