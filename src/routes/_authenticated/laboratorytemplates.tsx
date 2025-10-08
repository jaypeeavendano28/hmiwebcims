import { useState, useEffect } from "react";
import { Button, Space, Modal, Form, Input, Tooltip, notification, Select, Popconfirm } from "antd";
import { BiEdit, BiTrash } from "react-icons/bi";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { DataTable } from "primereact/datatable";
import { FilterMatchMode } from "primereact/api";
const { confirm } = Modal;
import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../store";
import { PostData } from "../../helpers";
import { Column } from "primereact/column";
import Loading from "../../components/loading";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TChagesPerLabTemplate, TLaboratoryResultTemplates, TLabTypes } from "../../types";
import { AxiosError } from "axios";
import dayjs from "dayjs";
export const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};
export const Route = createFileRoute("/_authenticated/laboratorytemplates")({
  component: () => <LaboratoryTemplates />,
});

const LaboratoryTemplates = () => {
  const q = useQueryClient();
  const store = useAppStore();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showLabChargesModal, setShowLabChargesModal] = useState(false);
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [Id, setId] = useState(0);
  const [selectedData, setSelectedData] = useState<TLaboratoryResultTemplates | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters] = useState({
    Description: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ReportDisplay: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ReportName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

   const labCharges = useQuery({
     queryKey: ["labCharges"],
     queryFn: async () => {
       const res = await PostData("GetRecords", {
         sp: "udp_GetLabTypes",
         parameters: {},
       });
       if (res) {
         
         return res.parameters.lst;
       }
     },
     refetchOnWindowFocus: false,
     staleTime: 0,
   });
   const labTypesPerTemplate = useQuery({
     queryKey: ["labTypesPerTemplate",selectedData],
     queryFn: async () => {
       const res = await PostData("GetRecords", {
         sp: "udp_GetLabTypePerLabTemplate",
         parameters: {
          Id: selectedData?.Id??0
         },
       });
       if (res) {
         return res.parameters.lst;
       }
     },
     refetchOnWindowFocus: false,
     staleTime: 0,
   });
   

  const handleNew = async () => {
    setId(0);
    form.resetFields();
    setShowModal(true);
  };
  const handleEdit = async (rec: any) => {
    setId(rec.Id);
    form.setFieldsValue({
      Description: rec.Description,
      ReportDisplay: rec.ReportDisplay,
      ReportName: rec.ReportName,
    });
    setShowModal(true);
  };
  const handleDelete = async (rec: any) => {
    confirm({
      title: "Do you want to delete this template?",
      okText: "Yes",
      cancelText: "No",
      icon: <ExclamationCircleOutlined />,

      onOk() {
        handleConfirmDelete(rec);
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  };

  const handleConfirmDelete = async (rec: any) => {
    const valuesToSave = {
      Id: rec.Id,
      username: store.username,
      Deleted: true,
    };

    const res = await PostData("SaveLaboratoryTemplate", valuesToSave);
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        setShowModal(false);
        handleInitialize();
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };

  const handleTemplateDetails = async (rec: any) => {
    // navigate("/laboratorytemplatedetails/" + rec.Id, {
    //   state: { details: rec },
    // });
    router.navigate({
      to: "/laboratorytemplatedetails/$Id",
      params: {
        Id: rec.Id,
      },
    });
  };

  const handleSaveTemplate = async (values: any) => {
    setIsSubmitting(true);
    const valuesToSave = {
      ...values,
      Id: Id,
      username: store.username,
      BranchCode: store.branchCode,
    };

    const res = await PostData("SaveLaboratoryTemplate", valuesToSave);
    if (res) {
      setIsSubmitting(false);
      if (res.status === 1) {
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        setShowModal(false);
        handleInitialize();
      } else {
        notification.success({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  const handleInitialize = async () => {
    setIsLoading(true);

    const res = await PostData("GetRecords", {
      sp: "udp_GetLaboratoryResultTemplates",
      parameters: {
        BranchCode: store.branchCode,
      },
    });

    if (res) {
      setIsLoading(false);
      setData(res.parameters.lst);
    }
  };
const handleLabCharges = (data:any)=>{
  form2.resetFields();

  setSelectedData(data);
  setShowLabChargesModal(true);
  // q.invalidateQueries({ queryKey: ["labTypesPerTemplate"] });
}
  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <BiEdit
            size={16}
            className="cursor-pointer text-gray-500 hover:text-gray-600"
            onClick={() => handleEdit(data)}
          />
        </Tooltip>
        <Tooltip title="Template Details">
          <BiEdit
            size={16}
            className="cursor-pointer text-gray-500 hover:text-gray-600"
            onClick={() => handleTemplateDetails(data)}
          />
        </Tooltip>
        <Tooltip title="Laboratory Charges">
          <BiEdit
            size={16}
            className="cursor-pointer text-gray-500 hover:text-gray-600"
            onClick={() => handleLabCharges(data)}
          />
        </Tooltip>
        <Tooltip title="Delete">
          <BiTrash
            size={16}
            className="cursor-pointer  text-red-500 hover:text-red-800"
            onClick={() => handleDelete(data)}
          />
        </Tooltip>
      </Space>
    );
  };
   const actionBodyTemplate2 = (data: any) => {
     return (
       <Space>
         <Tooltip title="Delete">
           <Popconfirm title="Are you sure to delete this record?" onConfirm={() => handleDelete2(data)} okText="Yes" cancelText="No">
             <BiTrash
               size={16}
               className="cursor-pointer  text-red-500 hover:text-red-800"
          
             />
           </Popconfirm>
         </Tooltip>
       </Space>
     );
   };
   const handleDelete2 = async (data: any) => {
      try {
        setIsSubmitting(true);

        const res = await PostData("DeleteChargesPerLabTemplate", {
          Id: data.Id,
        });
        if (res) {
          setIsSubmitting(false);
          if (res.status === 1) {
            notification.success({
              message: "Successfully deleted!",
              placement: "topRight",
              duration: 3,
            });
            q.invalidateQueries({
              queryKey: ["labTypesPerTemplate"],
            });
          
          }
        }
      } catch (error: AxiosError | any) {
        setIsSubmitting(false);
        if (error.status === 400) {
          notification.error({
            message: error.response.data,
            placement: "topRight",
            duration: 3,
          });
        }
      }
   }
  const handleSubmitChargePerLabTemplate = async (values: TChagesPerLabTemplate) => {
    try {
        setIsSubmitting(true);

        const res = await PostData("SaveChargesPerLabTemplate", {...values, 
          fk_LaboratoryResultTemplates_Id:selectedData?.Id} );
        if (res) {
         
          setIsSubmitting(false);
          if (res.status === 1) {
            notification.success({
              message: "Successfully saved!",
              placement: "topRight",
              duration: 3,
            });
            q.invalidateQueries({ queryKey: ["labTypesPerTemplate",selectedData] });
            form2.resetFields();
          
         
          } 
        }
    } catch (error:AxiosError | any ) {
      setIsSubmitting(false);
      if (error.status===400){
        notification.error({
          message: error.response.data,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  
  }
  useEffect(() => {
    handleInitialize();
  }, []);

  return (
    <div className="ml-2 mt-2 mr-2 cardBackground">
      <h1 className="text-center font-bold">Laboratory Templates</h1>

      <Button type="primary" onClick={() => handleNew()}>
        New
      </Button>

      {isLoading ? (
        <Loading size={64} />
      ) : (
        <div className="mt-2">
          <div className="mt-2">
            <DataTable
              value={data}
              tableStyle={{ minWidth: "50rem" }}
              filters={filters}
              filterDisplay="row"
            >
              <Column
                field="action"
                header="Action"
                body={(data) => actionBodyTemplate(data)}
              ></Column>
              <Column field="Description" header="Description" filter></Column>
              <Column
                field="ReportDisplay"
                header="Report Display"
                filter
              ></Column>
              <Column field="ReportName" header="Report Name" filter></Column>
            </DataTable>
          </div>
        </div>
      )}

      <Modal
        title="Laboratory Template"
        open={showModal}
        onCancel={() => setShowModal(false)}
        okText="Save"
        cancelText="Cancel"
        footer={false}
        width="1000px"
        destroyOnClose
      >
        <Form
          //  layout="vertical"
          {...formItemLayout}
          form={form}
          onFinish={handleSaveTemplate}
          scrollToFirstError
        >
          <Form.Item
            label="Description"
            name="Description"
            rules={[
              {
                required: true,
                message: "Examination Name is required!",
              },
              { max: 100 },
            ]}
            normalize={(v) => v.toUpperCase()}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Report Display"
            name="ReportDisplay"
            rules={[
              {
                required: true,
                message: "Report Display is required!",
              },
              { max: 100 },
            ]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Report Name"
            name="ReportName"
            rules={[
              {
                required: true,
                message: "Report name is required!",
              },
              { max: 100 },
            ]}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        open={showLabChargesModal}
        onCancel={() => setShowLabChargesModal(false)}
        footer={false}
        width="800px"
        destroyOnClose
      >
        <Form
          form={form2}
          layout="vertical"
          onFinish={handleSubmitChargePerLabTemplate}
        >
          <Form.Item name="fk_LabTypes_Id" label="Description">
            <Select
              showSearch
              allowClear
              filterOption={(input, option) =>
                (
                  option!.children
                    ?.toString()
                    .toLocaleLowerCase() as unknown as string
                ).includes(input.toLocaleLowerCase())
              }
            >
              {labCharges.data &&
                labCharges.data.map((d: TLabTypes) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Description}>
                    {d.Description}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <div className="flex justify-end  ">
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </div>
        </Form>
        <DataTable
          value={labTypesPerTemplate.data}
      
          filters={filters}
          filterDisplay="row"
        >
          <Column
            field="action"
            header="Action"
            body={(data) => actionBodyTemplate2(data)}
          ></Column>
          <Column field="LabType" header="Laboratory Type" ></Column>
          <Column field="AddedBy" header="Added By" ></Column>
          <Column field="DateAdded" header="Date Added"
            body={(data: any) =>
                          dayjs(data.Date).format("MM/DD/YYYY")
                        }
          
          ></Column>
        </DataTable>
      
      </Modal>
    </div>
  );
};
