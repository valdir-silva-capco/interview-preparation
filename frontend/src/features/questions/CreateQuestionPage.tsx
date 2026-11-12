import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { QuestionForm } from './QuestionForm';
import {
  createQuestion,
  questionKeys,
  type SaveQuestionInput,
} from './questions-api';
import { CompanyGate } from '../companies/CompanyGate';

export function CreateQuestionPage() {
  return (
    <CompanyGate>
      {(companyId) => <CreateQuestionForm companyId={companyId} />}
    </CompanyGate>
  );
}

function CreateQuestionForm({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (input: SaveQuestionInput) => createQuestion(companyId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: questionKeys.all(companyId),
      });
      await navigate({ to: '/' });
    },
  });

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6">
      <div>
        <p className="eyebrow">Your collection</p>
        <h1 className="page-title">New Question</h1>
      </div>
      <QuestionForm
        submitLabel="Save question"
        isPending={mutation.isPending}
        error={mutation.error?.message}
        onSubmit={(input) => mutation.mutate(input)}
      />
    </section>
  );
}
