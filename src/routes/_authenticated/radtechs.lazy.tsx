import { createLazyFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Button,
  Divider,
  notification,
  Popconfirm,
  Space,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import useAppStore from "../../store";
import { useQuery } from "@tanstack/react-query";
import { PostData, WithAccess } from "../../helpers";
import { FilterMatchMode } from "primereact/api";
import { TMedtechs } from "../../types";
import { BiEdit, BiTrash } from "react-icons/bi";
import Loading from "../../components/loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
export const Route = createLazyFileRoute("/_authenticated/radtechs")({
  component: () => <Radtechs />,
});

const Radtechs = () => {
  const router = useRouter();
  const store = useAppStore();
  const [expandedRows, setExpandedRows] = useState(null);
  const [deletingId, setDeletingId] = useState(0);
  const [filters] = useState({
    Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const data = useQuery({
    queryKey: ["data"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetListOfMedtechs",
        parameters: {
          Type: "X",
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleDelete = async (record: TMedtechs) => {
    try {
      setDeletingId(record.Id);
      const res = await PostData("DeleteMedtech", { Id: record.Id });

      if (res?.status !== 1) {
        notification.error({
          message: res?.message || "Unable to delete radiology technologist.",
          placement: "topRight",
        });
        return;
      }

      notification.success({
        message: "Radiology technologist deleted.",
        placement: "topRight",
      });
      await data.refetch();
    } catch (error: any) {
      notification.error({
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to delete radiology technologist.",
        placement: "topRight",
      });
    } finally {
      setDeletingId(0);
    }
  };

  const actionBodyTemplate = (data: TMedtechs) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <Link
            to="/radtech/$Id"
            params={{
              Id: data.Id.toString(),
            }}
          >
            <Button type="primary" icon={<BiEdit />} />
          </Link>
        </Tooltip>
        <Popconfirm
          title="Delete this radiology technologist?"
          description="This record will be removed from the active list."
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(data)}
        >
          <Tooltip title="Delete">
            <Button
              type="primary"
              danger
              icon={<BiTrash />}
              loading={deletingId === data.Id}
            />
          </Tooltip>
        </Popconfirm>
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
        ModuleId: 32,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-Utilities-Radtechs",
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
      <Divider>Radiology Technologist</Divider>
      <Button
        type="primary"
        onClick={() => {
          router.navigate({
            to: "/radtech/$Id",
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
            <Column field="Type" header="Type" filter></Column>
          </DataTable>
        )}
      </div>
    </div>
  );
};
