import { FC, useEffect, useState } from "react";
import { TAppointments } from "../types";
import { PostData } from "../helpers";
import { Button, Space } from "antd";
import { Link } from "@tanstack/react-router";

type Props = {
  PatientId: number;
};

type AppointmentDetailsProps = {
  Details: TAppointments;
};
const AppointmentPerPatient: FC<Props> = ({ PatientId }) => {
  const [appointments, setAppointments] = useState<TAppointments[] | undefined>(
    []
  );
  const handleGetAppointments = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetAppointmentsPerPatient",
      parameters: {
        Id: PatientId,
      },
    });

    if (res) {
      setAppointments(res.parameters.lst);
    }
  };

  const AppointmentDetails: FC<AppointmentDetailsProps> = ({ Details }) => {
    return (
      <div className="cardBackGround mb-2">
        <div className="grid lg:grid-cols-12">
          <div className="col-span-2">
            <p>Appointment Id</p>
            <p className="font-bold">{Details.Id}</p>
            <p>Appointment No.</p>
            <p className="font-bold">{Details.AppointmentNo}</p>
            <p>Date</p>
            <p className="font-bold">{Details.TransDate}</p>
            <p>Appointment Type</p>
            <p className="font-bold">{Details.AppointmentTypeDesc}</p>
          </div>
          <div className="col-span-10">
            <Space>
              <Link
                to="/appointmentdetails/$Id"
                params={{
                  Id: Details.Id!.toString(),
                }}
              >
                <Button type="primary">Appointment Details</Button>
              </Link>

              <Link
                to="/mer/$AppointmentId"
                params={{
                  AppointmentId: Details.Id!.toString(),
                }}
              >
                <Button type="primary">MER</Button>
              </Link>

              <Link
                to="/merschool/$AppointmentId"
                params={{
                  AppointmentId: Details.Id!.toString(),
                }}
              >
                <Button type="primary">MER(School)</Button>
              </Link>
            </Space>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    handleGetAppointments();
  }, []);
  return (
    <div>
      {appointments!.length > 0 ? (
        appointments?.map((v: TAppointments) => (
          <div>
            <AppointmentDetails Details={v} />
          </div>
        ))
      ) : (
        <div className="font-bold text-center">Patient has no appointment!</div>
      )}
    </div>
  );
};

export default AppointmentPerPatient;
