import { useQuery } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { PostData } from "../helpers";
import { Column } from "primereact/column";

type Props = {
  AppointmentId: number;
};

export default function ({ AppointmentId }: Props) {
  const resultStatus = useQuery({
    queryKey: ["resultStatus", AppointmentId],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetChargesByAppointmentIdAll",
        parameters: {
          AppointmentId: AppointmentId,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  return (
    <div>
      <DataTable
        value={resultStatus.data}
        emptyMessage="No Records!"
        stripedRows
        size="small"
      >
        <Column field="Description" header="Description"></Column>
        <Column field="Status" header="Status"></Column>
        <Column field="StatusDate" header="Date"></Column>
      </DataTable>
    </div>
  );
}
