import { createLazyFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Button, Divider, notification, Space, Tag, Tooltip } from "antd";
import { useEffect, useState } from "react";
import useAppStore from "../../store";
import { useQuery } from "@tanstack/react-query";
import { PostData, WithAccess } from "../../helpers";
import { FilterMatchMode } from "primereact/api";
import { TMedtechs } from "../../types";
import { BiEdit } from "react-icons/bi";
import { PlusOutlined } from "@ant-design/icons";
import Loading from "../../components/loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export const Route = createLazyFileRoute("/_authenticated/medtechs")({
  component: () => <Medtechs />,
});

const Medtechs = () => {
  const router = useRouter();
  const store = useAppStore();
  const [expandedRows, setExpandedRows] = useState(null);
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const data = useQuery({
    queryKey: ["medtechs"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetListOfMedtechs",
        parameters: {
          Type: "M",
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const actionBodyTemplate = (data: TMedtechs) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Link
            to="/medtech/$Id"
            params={{
              Id: data.Id.toString(),
            }}
          >
            <Button type="primary" icon={<BiEdit />} />
          </Link>
        </Tooltip>
      </Space>
    );
  };
  const rowExpansionTemplate = (data: TMedtechs) => {
    return (
      <div className="p-3">
        <div>Updated By</div>
        <div>
          <strong>{data.UpdatedBy}</strong>
        </div>
        <div>Date Updated</div>
        <div>
          <strong>{data.DateUpdated}</strong>
        </div>
      </div>
    );
  };
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: 28,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-Utilities-Medtechs",
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
    store.setHideSideBar("N");
    handleWithAccess();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Medical Technologists</Divider>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => {
          router.navigate({
            to: "/medtech/$Id",
            params: {
              Id: "0",
            },
          });
        }}
      >
        New
      </Button>
      <div className="mt-2">
        {data.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={data.data}
            tableStyle={{ minWidth: "50rem" }}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filters={filters}
            filterDisplay="row"
            rowExpansionTemplate={rowExpansionTemplate}
            expandedRows={expandedRows as any}
            onRowToggle={(e) => setExpandedRows(e.data as any)}
          >
            <Column
              expander={data.data!.length > 0}
              style={{ width: "5rem" }}
            />
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
            <Column field="Id" header="Id" filter></Column>
            <Column field="Name" header="Name" filter></Column>
            <Column
              field="IsQA"
              header="Quality Control"
              body={(row: TMedtechs) =>
                row.IsQA ? (
                  <Tag color="blue">YES</Tag>
                ) : (
                  <Tag>NO</Tag>
                )
              }
            ></Column>
          </DataTable>
        )}
      </div>
    </div>
  );
};
