import { Card, Space, Tooltip } from "antd";
import { TICd10 } from "../types";
import { useEffect, useState } from "react";
import { PostData } from "../helpers";
import Loading from "./loading";
import { DataTable } from "primereact/datatable";
import { FilterMatchMode } from "primereact/api";
import { Column } from "primereact/column";
import { FaCheck } from "react-icons/fa6";
type SearchICDProps = {
  handleClose: (data: TICd10) => void;
};

export default function SearchICD({ handleClose }: SearchICDProps) {
  // const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [icd, setIcd] = useState<TICd10[] | undefined>();
  const [filters] = useState({
    CODE_TYPE: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ITEM_CODE: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ITEM_DESC: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const handleGetIcd = async () => {
    setIsLoading(true);
    try {
      const res = await PostData("GetRecords", {
        sp: "udp_GetICD10",
        parameters: {},
      });
      if (res) {
        setIsLoading(false);
        setIcd(res.parameters.lst);
      }
    } catch (error) {
      setIsLoading(false);
      console.log(error);
    }
  };
  const actionBodyTemplate = (data: TICd10) => {
    return (
      <Space>
        <Tooltip title="Select">
          <FaCheck
            onClick={() => {
              handleClose(data);
            }}
            size={16}
            className="cursor-pointer"
          />
        </Tooltip>
      </Space>
    );
  };
  // const handleSearchIcd = async (v: TSearchIcd) => {
  //   try {
  //     const res = await PostData("SearchIcd10", v);
  //     if (res) {
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  useEffect(() => {
    handleGetIcd();
  }, []);
  return (
    <div>
      <Card title="Search ICD10/RVS">
        {/* <Form form={form} layout="vertical" onFinish={handleSearchIcd}>
          <Form.Item name="Description" label="Description">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Search
          </Button>
        </Form> */}
        {isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={icd}
            tableStyle={{ minWidth: "50rem" }}
            paginator
            rows={25}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filters={filters}
            filterDisplay="row"
          >
            <Column field="CODE_TYPE" header="Type" filter></Column>
            <Column field="ITEM_CODE" header="ICD10/RVS" filter></Column>
            <Column field="ITEM_DESC" header="Description" filter></Column>
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
          </DataTable>
        )}
      </Card>
    </div>
  );
}
