import { createFileRoute } from "@tanstack/react-router";
import { Divider } from "antd";

export const Route = createFileRoute("/_authenticated/purchaseorders")({
  component: () => <PurchaseOrders />,
});

const PurchaseOrders = () => {
  return (
    <div className="cardBackGround">
      <Divider>Purchase Orders</Divider>
    </div>
  );
};
