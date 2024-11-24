import { createFileRoute } from "@tanstack/react-router";
import useAppStore from "../../store";
import { useEffect } from "react";
import { Button } from "antd";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: () => <Dashboard />,
});

const Dashboard = () => {
  const store = useAppStore();
  useEffect(() => {
    store.setHideSideBar("N");
  }, []);
  return (
    <div>
      <h1>Dashboard</h1>
      <Button type="primary">Print</Button>
    </div>
  );
};
