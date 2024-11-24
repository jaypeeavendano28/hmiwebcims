import { createLazyFileRoute } from "@tanstack/react-router";
import { Divider } from "antd";

export const Route = createLazyFileRoute("/_authenticated/receiving")({
  component: () => <Receiving />,
});
const Receiving = () => {
  return (
    <div className="cardBackGround">
      <Divider>Receiving</Divider>
    </div>
  );
};
