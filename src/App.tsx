import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./hooks/userAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import useAppStore from "./store";

const router = createRouter({
  routeTree,
  context: { authentication: undefined! },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
const App = () => {
  const queryClient = new QueryClient();
  const authentication = useAuth();
  const store = useAppStore();
  useEffect(() => {
    store.setHideSideBar("N");
  }, []);
  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ authentication }} />
      </QueryClientProvider>
    </div>
  );
};

export default App;
