import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/material-management/render-stock-requests',
)({
  component: () => <RenderStockRequests />,
});

const RenderStockRequests = () => {
  return <div>Purchase Order</div>;
};
