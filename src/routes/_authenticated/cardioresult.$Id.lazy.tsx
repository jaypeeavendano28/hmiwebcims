import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createLazyFileRoute('/_authenticated/cardioresult/$Id')({
  component: () => <CardioResultRedirect />,
});

const CardioResultRedirect = () => {
  const { Id } = Route.useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate({
      to: '/cardiologyresult/$Id',
      params: { Id },
      replace: true,
    });
  }, [Id, navigate]);

  return (
    <div className="p-4 text-sm text-slate-600">
      Opening cardiology result...
    </div>
  );
};
