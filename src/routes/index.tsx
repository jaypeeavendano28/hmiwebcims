import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "antd";
import { useAuth } from "../hooks/userAuth";
export const Route = createFileRoute("/")({
  component: () => <HomePage />,
});

const HomePage = () => {
  const auth = useAuth();
  const router = useRouter();
  const handleLogOut = () => {
    auth.signOut();
    router.navigate({
      to: "/login",
    });
  };

  return (
    <div>
      <h1>Home Page</h1>

      {auth.isLogged() ? (
        <Button type="primary" onClick={handleLogOut}>
          Logout
        </Button>
      ) : (
        <Button type="primary">
          <Link to="/login">Login</Link>
        </Button>
      )}
    </div>
  );
};
