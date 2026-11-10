import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { QuestionForm } from './QuestionForm';
import {
  getQuestion,
  lastEditedQuestionStorageKey,
  questionKeys,
  updateQuestion,
  type SaveQuestionInput,
} from './questions-api';
import { CompanyGate } from '../companies/CompanyGate';

export function EditQuestionPage() {
  const { questionId } = useParams({
    from: '/questions/$questionId/edit',
  });
  return (
    <CompanyGate>
      {(companyId) => (
        <EditQuestionForm companyId={companyId} questionId={questionId} />
      )}
    </CompanyGate>
  );
}

function EditQuestionForm({
  companyId,
  questionId,
}: {
  companyId: string;
  questionId: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const questionQuery = useQuery({
    queryKey: questionKeys.detail(companyId, questionId),
    queryFn: () => getQuestion(companyId, questionId),
  });
  const mutation = useMutation({
    mutationFn: (input: SaveQuestionInput) =>
      updateQuestion(companyId, questionId, input),
    onSuccess: async (question) => {
      queryClient.setQueryData(
        questionKeys.detail(companyId, questionId),
        question,
      );
      sessionStorage.setItem(
        lastEditedQuestionStorageKey(companyId),
        question.id,
      );
      await queryClient.invalidateQueries({
        queryKey: questionKeys.all(companyId),
      });
      await navigate({ to: '/' });
    },
  });

  if (questionQuery.isPending) {
    return <p className="panel">Carregando pergunta…</p>;
  }
  if (questionQuery.isError) {
    return (
      <div role="alert" className="panel grid gap-3 text-red-200">
        <p>
          Não foi possível carregar a pergunta: {questionQuery.error.message}
        </p>
        <Link className="button-secondary w-fit" to="/">
          Voltar às perguntas
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6">
      <div>
        <p className="eyebrow">Sua coleção</p>
        <h1 className="page-title">Editar pergunta</h1>
      </div>
      <QuestionForm
        key={questionQuery.data.id}
        initialPrompt={questionQuery.data.prompt}
        initialAnswer={questionQuery.data.answer}
        submitLabel="Salvar alterações"
        isPending={mutation.isPending}
        error={mutation.error?.message}
        onSubmit={(input) => mutation.mutate(input)}
      />
    </section>
  );
}
