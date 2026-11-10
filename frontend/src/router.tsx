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
import { LoginPage } from './features/auth/LoginPage';
import { UsersPage } from './features/auth/UsersPage';
import { SpecialtiesPage } from './features/auth/SpecialtiesPage';
import { AccountPage } from './features/auth/AccountPage';

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
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
});
const specialtiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/specialties',
  component: SpecialtiesPage,
});
const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/account',
  component: AccountPage,
});

const routeTree = rootRoute.addChildren([
  questionsRoute,
  createQuestionRoute,
  editQuestionRoute,
  codeRoute,
  createCompanyRoute,
  loginRoute,
  usersRoute,
  specialtiesRoute,
  accountRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
