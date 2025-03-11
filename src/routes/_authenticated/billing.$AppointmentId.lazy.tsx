import { createLazyFileRoute } from "@tanstack/react-router";
import { Card } from "antd";
import { TAppointments } from "../../types";
import { useEffect, useState } from "react";
import { PostData } from "../../helpers";
import { Helmet } from "react-helmet";
import Charges from "../../components/Charges";

export const Route = createLazyFileRoute(
  "/_authenticated/billing/$AppointmentId"
)({
  component: () => <Billing />,
});
const Billing = () => {
  const [title, setTitle] = useState<string>("");
  const { AppointmentId } = Route.useParams();
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();

  const handleGetAppointmentDetails = async () => {
    try {
      const res = await PostData("GetRecords", {
        sp: "udp_GetAppointmentDetails",
        parameters: {
          Id: AppointmentId,
        },
      });
      if (res) {
        setTitle("Billing for patient-" + res.parameters.lst[0].Name);
        setAppointmentDetails(res.parameters.lst[0]);
      }
    } catch (error) {}
  };
  useEffect(() => {
    handleGetAppointmentDetails();
  }, []);
  const cardTitle = () => {
    return (
      <>
        <div className="grid grid-cols-6 gap-4">
          <div>
            <div>Appointment ID</div>
            <div className="font-bold">{appointmentDetails?.Id}</div>
          </div>
          <div className="col-span-2">
            <div>Patient Name</div>
            <div className="font-bold">{appointmentDetails?.Name}</div>
          </div>
          <div>
            <div>Birth Date</div>
            <div className="font-bold">
              {appointmentDetails?.DateOfBirthStr}
            </div>
          </div>
          <div>
            <div>Age</div>
            <div className="font-bold">{appointmentDetails?.AgeYears}</div>
          </div>
          <div>
            <div>Sex</div>
            <div className="font-bold">{appointmentDetails?.Sex}</div>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-4">
          <div>
            <div>Discount Type</div>
            <div className="font-bold">{appointmentDetails?.DiscountType}</div>
          </div>
          <div>
            <div>HMO/Company</div>
            <div className="font-bold">
              {appointmentDetails?.HmoCompanyName}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <Card title={cardTitle()}>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{title}</title>
      </Helmet>
      <Helmet>
        <meta charSet="utf-8" />
        <title>{title}</title>
      </Helmet>
      <div className="mt-2">
        <Charges AppointmentId={Number(AppointmentId)} />
      </div>
      {/* <Tabs defaultActiveKey="1" items={items} /> */}
    </Card>
  );
};
