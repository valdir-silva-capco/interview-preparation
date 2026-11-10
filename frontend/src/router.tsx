import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { RootLayout } from './components/RootLayout';
import { CreateCompanyPage } from './features/companies/CreateCompanyPage';
import { CodeEditorPage } from './features/code-editor/CodeEditorPage';
import { CreateQuestionPage } from './features/questions/CreateQuestionPage';
import { EditQuestionPage } from './features/questions/EditQuestionPage';
import { QuestionsPage } from './features/questions/QuestionsPage';

const rootRoute = createRootRoute({ component: RootLayout });

const questionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: QuestionsPage,
});
const createQuestionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/questions/new',
  component: CreateQuestionPage,
});
const editQuestionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/questions/$questionId/edit',
  component: EditQuestionPage,
});
const codeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/code',
  component: CodeEditorPage,
});
const createCompanyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/companies/new',
  component: CreateCompanyPage,
});

const routeTree = rootRoute.addChildren([
  questionsRoute,
  createQuestionRoute,
  editQuestionRoute,
  codeRoute,
  createCompanyRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
