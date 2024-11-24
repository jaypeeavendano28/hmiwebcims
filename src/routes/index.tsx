import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "antd";
import { useAuth } from "../hooks/userAuth";
import { registerLicense } from "@syncfusion/ej2-base";
export const Route = createFileRoute("/")({
  component: () => <HomePage />,
});
registerLicense(
  "ORg4AjUWIQA/Gnt2VVhiQlFaclZJXGFWfVJpTGpQdk5xdV9DaVZUTWY/P1ZhSXxQdkdjX31dcHVXRmdcV0w="
);
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
