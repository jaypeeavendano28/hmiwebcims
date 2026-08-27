import { useQuery } from "@tanstack/react-query";
import { TCharges } from "../types";
import { PostData } from "../helpers";
import Loading from "./loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "antd";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";

type Props = {
  AppointmentId: number;
  PaymentType?: string;
};

export default function ChargesPerAppointment({
  AppointmentId,
  PaymentType,
}: Props) {
  const listOfCharges = useQuery<TCharges[]>({
    queryKey: ["listOfCharges", AppointmentId, PaymentType],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetChargesByAppointmentId",
        parameters: {
          AppointmentId,
        },
      });
      if (res) {
        const charges = res.parameters.lst as TCharges[];

        if (!PaymentType) return charges;

        return charges.filter(
          (charge) =>
            charge.PaymentType?.trim().toUpperCase() ===
            PaymentType.trim().toUpperCase(),
        );
      }

      return [];
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const totalAmount = () => {
    let total = 0;
    for (let sale of listOfCharges.data ?? []) {
      total += sale.Gross!;
    }
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const totalPayments = () => {
    let total = 0;
    for (let sale of listOfCharges.data ?? []) {
      total += sale.CashPayment!;
    }
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const totalBalance = () => {
    let total = 0;
    for (let sale of listOfCharges.data ?? []) {
      total += sale.Net!;
    }
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          //   colSpan={4}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
          }}
        />
        <Column className="text-lg text-right" footer={totalAmount} />
        <Column className="text-lg text-right" footer={totalPayments} />
        <Column className="text-lg text-right" footer={totalBalance} />
      </Row>
    </ColumnGroup>
  );
  return (
    <div>
      <Card title="Charges">
        <div>
          {listOfCharges.isLoading ? (
            <Loading size={64} />
          ) : (
            <DataTable
              value={listOfCharges.data}
              emptyMessage="No Records!"
              stripedRows
              size="small"
              filterDisplay="row"
              footerColumnGroup={footerGroup}
            >
              <Column field="Description" header="Description"></Column>
              <Column
                field="Gross"
                header="Gross"
                alignHeader={"right"}
                className="text-right"
                body={(data: TCharges) =>
                  data.Gross?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
              ></Column>
              <Column
                field="HmoAmount"
                header="Hmo"
                alignHeader={"right"}
                className="text-right"
                body={(data: TCharges) =>
                  data.HmoAmount?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
              ></Column>
              <Column
                field="CashPayment"
                header="Cash Payment"
                alignHeader={"right"}
                className="text-right"
                body={(data: TCharges) =>
                  data.CashPayment?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
              ></Column>
              <Column
                field="Net"
                header="Net"
                alignHeader={"right"}
                className="text-right"
                body={(data: TCharges) =>
                  data.Net?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
              ></Column>
              <Column field="PaymentType" header="Payment Type"></Column>
            </DataTable>
          )}
        </div>
      </Card>
    </div>
  );
}
