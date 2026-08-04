import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/material-management/stock-issuance',
)({
  beforeLoad: async ({ context }) => {
    const hasAccess = await context.authentication.isWithAccess(53);

    if (!hasAccess) {
      throw redirect({ to: '/' });
    }
  },
  component: Outlet,
});
