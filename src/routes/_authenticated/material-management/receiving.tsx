import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/material-management/receiving',
)({
  beforeLoad: async ({ context }) => {
    const hasAccess = await context.authentication.isWithAccess(52);

    if (!hasAccess) {
      throw redirect({ to: '/' });
    }
  },
  component: Outlet,
});
