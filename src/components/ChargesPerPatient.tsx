import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { FC, useEffect, useState } from "react";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import {
  Button,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Space,
  Tooltip,
} from "antd";
import { Link } from "@tanstack/react-router";
import { BiEdit, BiNotepad } from "react-icons/bi";

type Props = {
  AppointmentId?: number;
  handleNewResult?: (data: any) => void;
  Key?: string;
  Counter?: string;
};
const ChargesPerPatient: FC<Props> = ({
  AppointmentId,
  handleNewResult,
  Key,
  Counter,
}) => {
  const [selectedRow, setSelectedRow] = useState<any | undefined>({});
  const [form] = Form.useForm();
  const [showModal, setShowModal] = useState(false);
  const [charges, setCharges] = useState([]);
  const handleGetCharges = async () => {
    try {
      const res = await PostData("GetRecords", {
        sp: "udp_GetChargesByAppointmentIdForResult",
        parameters: {
          AppointmentId: AppointmentId,
        },
      });

      if (res) {
        setCharges(res.parameters.lst);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const actionBodyTemplate = (data: any) => {
    //  store.setItemDetails(data);
    return (
      <Space>
        {Counter === data.QCounter && (
          <Tooltip title="Set Status">
            <Link>
              <BiEdit
                size={16}
                onClick={() => {
                  setSelectedRow(data);
                  form.resetFields();
                  if (!isNullOrUndefinedOrBlank(data.Status)) {
                    form.setFieldsValue({
                      Status: data.Status,
                      StatusRemarks: data.StatusRemarks,
                    });
                  }

                  setShowModal(true);
                }}
              />
            </Link>
          </Tooltip>
        )}

        {Counter === data.QCounter && Counter !== "LAB" && (
          <>
            <Tooltip title="Result">
              <Link>
                <BiNotepad size={16} onClick={() => handleNewResult!(data)} />
              </Link>
            </Tooltip>
          </>
        )}
      </Space>
    );
  };
  const handleSetStatus = async (v: any) => {
    try {
      const res = await PostData("SaveSetStatus", {
        Id: selectedRow.Id,
        Status: v.Status,
        StatusRemarks: v.StatusRemarks,
      });

      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Successfully Saved!",
            placement: "topRight",
            duration: 3,
          });
          handleGetCharges();
          setShowModal(false);
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };
  useEffect(() => {
    handleGetCharges();
  }, [AppointmentId, Key]);
  return (
    <div>
      <DataTable
        value={charges}
        // paginator
        // rows={10}
        // rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No Records!"
        stripedRows
        size="small"
      >
        <Column
          field="action"
          header="Action"
          body={(data: any) => actionBodyTemplate(data)}
        ></Column>
        <Column field="Description" header="Description"></Column>
        <Column field="Status" header="Status"></Column>
        <Column field="StatusDate" header="Status set Date"></Column>
        <Column field="StatusSetBy" header="Status Set By"></Column>
        <Column field="StatusRemarks" header="Status Remarks"></Column>
        <Column field="Gross" header="Gross"></Column>
        <Column field="HmoAmount" header="Hmo"></Column>
        <Column field="CashPayment" header="Cash Payment"></Column>
        <Column field="Net" header="Net"></Column>
        <Column field="PaymentType" header="Payment Type"></Column>
        <Column field="ResultId" header="ResultId"></Column>
        <Column field="QCounter" header="Q Counter"></Column>
      </DataTable>
      <Modal
        open={showModal}
        destroyOnClose
        footer={false}
        onCancel={() => setShowModal(false)}
        width={500}
        title={`Set status for ${selectedRow.Description}`}
      >
        <Form form={form} onFinish={handleSetStatus} layout="vertical">
          <Form.Item
            name="Status"
            label="Status"
            rules={[
              {
                required: true,
                message: "Status is required!",
              },
            ]}
          >
            <Select>
              <Select.Option key="DONE" value="DONE">
                DONE
              </Select.Option>
              <Select.Option key="TO FOLLOW" value="TO FOLLOW">
                TO FOLLOW
              </Select.Option>
              <Select.Option key="DEFERRED" value="DEFERRED">
                DEFERRED
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="StatusRemarks"
            label="Remarks"
            normalize={(v) => v.toUpperCase()}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    getFieldValue("Status") === "DEFERRED" &&
                    isNullOrUndefinedOrBlank(value)
                  ) {
                    return Promise.reject("Remarks is required!");
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ChargesPerPatient;
