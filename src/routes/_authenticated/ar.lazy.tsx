import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { PostData } from "../../helpers";
import Loading from "../../components/loading";
import { DataTable } from "primereact/datatable";
import { useState } from "react";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { TAccountsReceivable } from "../../types";
import { Button, Space, Tooltip } from "antd";
import { TbListDetails } from "react-icons/tb";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";

export const Route = createLazyFileRoute("/_authenticated/ar")({
  component: () => <Ar />,
});

const Ar = () => {
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const lst = useQuery({
    queryKey: ["lst"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetHmoCompany",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const actionBodyTemplate = (data: TAccountsReceivable) => {
    return (
      <Space>
        <Tooltip title="Details">
          <Link
            to="/ardetails/$Id"
            params={{
              Id: data.Id.toString(),
            }}
          >
            <TbListDetails size={16} />
          </Link>
        </Tooltip>
      </Space>
    );
  };

  const totalBalance = () => {
    let total = 0;

    for (let sale of lst.data) {
      total += sale.Balance;
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
          colSpan={5}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
          }}
        />
        <Column className="text-lg" footer={totalBalance} />
      </Row>
    </ColumnGroup>
  );
  const bodyBalance = (rowData: TAccountsReceivable) => {
    return rowData.Balance?.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const saveAsExcelFile = (buffer: any, fileName: any) => {
    import("file-saver").then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        let EXCEL_EXTENSION = ".xlsx";
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(
          data,
          fileName + "_export_" + new Date().getTime() + EXCEL_EXTENSION
        );
      }
    });
  };
  const exportExcel = () => {
    import("xlsx").then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(lst.data);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ["data"] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      saveAsExcelFile(excelBuffer, "AR");
    });
  };

  return (
    <>
      <div className="text-center text-xl">Accounts Receivable</div>
      <div className="mt-2">
        <Button type="primary" onClick={exportExcel}>
          Export to excel
        </Button>
        {lst.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={lst.data}
            tableStyle={{ minWidth: "50rem" }}
            paginator
            rows={25}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filters={filters}
            filterDisplay="row"
            footerColumnGroup={footerGroup}
          >
            <Column field="Name" header="Name" filter></Column>
            <Column field="Address" header="Address"></Column>
            <Column field="ContactPerson" header="Contact Person"></Column>
            <Column field="ContacNos" header="Contact Nos."></Column>
            <Column field="EmailAddress" header="Email Address"></Column>
            <Column
              field="Balance"
              header="Balance"
              body={bodyBalance}
              className="font-bold"
            ></Column>
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
          </DataTable>
        )}
      </div>
    </>
  );
};
