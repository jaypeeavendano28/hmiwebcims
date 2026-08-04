import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/material-management/quantity-on-hand',
)({
  beforeLoad: async ({ context }) => {
    const hasAccess = await context.authentication.isWithAccess(54);

    if (!hasAccess) {
      throw redirect({ to: '/' });
    }
  },
  component: Outlet,
});
