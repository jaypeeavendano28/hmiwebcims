import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Divider, notification, Tabs, TabsProps } from "antd";
import useAppStore from "../../store";
import { useEffect } from "react";
import { WithAccess } from "../../helpers";
import PharmacySales from "../../components/PharmacySales";
import PharmacyRequests from "../../components/PharmacyRequests";

export const Route = createFileRoute("/_authenticated/pharmacy")({
  component: () => <Pharmacy />,
});

const Pharmacy = () => {
  const router = useRouter();
  const store = useAppStore();
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Sales",
      children: <PharmacySales />,
    },
    {
      key: "2",
      label: "Requests",
      children: <PharmacyRequests />,
    },
  ];
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: 18,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-Pharmacy",
          placement: "topRight",
          duration: 3,
        });
        router.navigate({
          to: "/",
        });
      }
    }
  };
  useEffect(() => {
    handleWithAccess();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Pharmacy</Divider>
      {/* <Link
        to="/pharmacysales/$Id"
        params={{
          Id: "0",
        }}
      >
        <Button type="primary">New</Button>
      </Link> */}
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};
