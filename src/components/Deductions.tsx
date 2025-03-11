import { Card } from "antd";

type DeductionsProps = {
  AppointmentId: number;
};

export default function Deductions({ AppointmentId }: DeductionsProps) {
  return (
    <Card title="Deductions">
      <p>{AppointmentId}</p>
    </Card>
  );
}
