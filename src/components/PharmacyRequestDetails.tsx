import { useEffect, useState } from 'react';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button, Form, InputNumber, notification, Space, Tooltip } from 'antd';
import { FaRegEdit } from 'react-icons/fa';
import dayjs from 'dayjs';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';

export default function PharmacyRequestDetails({
  Id,
  handleClose,
  AppointmentId,
}: {
  Id?: number;
  AppointmentId?: number;
  handleClose: () => void;
}) {
  const [selectedRecord, setSelectedRecord] = useState<any | undefined>();
  const [form] = Form.useForm();

  const [list, setList] = useState([]);
  const hadleGetRequestDetails = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetPharmacyRequestDetails',
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      setList(res.parameters.lst);
    }
  };
  const actionBodyTemplate = (data: any) => {
    return (
      <Space>
        <Tooltip title="Render Request">
          {/* {isNullOrUndefinedOrBlank(RenderedBy) && (
            <FaRegEdit
              size={24}
              color="green"
              className="cursor-pointer"
              onClick={() => {
                form.setFieldValue("Qty", data.Qty);

                setSelectedRecord(data);
              }}
            />
          )} */}
          <FaRegEdit
            size={24}
            color="green"
            className="cursor-pointer"
            onClick={() => {
              form.setFieldValue('Qty', data.Qty);

              setSelectedRecord(data);
            }}
          />
        </Tooltip>
      </Space>
    );
  };
  const handleFinish = (v: any) => {
    if (v.Qty > selectedRecord.Qty) {
      notification.error({
        message: 'Quantity must not be greater than the requested quantity!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    const index = list.findIndex((val: any) => val.Id === selectedRecord.Id);
    const list2: any = [...list];
    list2[index].Qty = v.Qty;
    var amount = v.Qty * selectedRecord.Price;

    list2[index].Amount = amount;

    setList(list2);
    setSelectedRecord(null);
  };
  const handleSubmit = async () => {
    try {
      console.log({
        AppointmentId: AppointmentId,
        Date: dayjs(),
        Items: list,
      });
      const res = await PostData('SaveRenderRequest', {
        AppointmentId: AppointmentId,
        Date: dayjs(),
        Items: list,
      });
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: 'Successfully saved!',
            placement: 'topRight',
            duration: 3,
          });
          handleClose();
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-PH');
  };

  const net = () => {
    let total = 0;

    list.map((sale: any) => {
      total += sale.Gross!;
    });
    console.log(total);
    return formatCurrency(total);
  };
  const qty = () => {
    let total = 0;

    list.map((sale: any) => {
      total += sale.Qty!;
    });

    return total;
  };
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={2}
          footerStyle={{
            textAlign: 'right',
            fontWeight: 'bold',
          }}
        />

        <Column footer={qty} />
        <Column footer="" />
        <Column footer={net} />
      </Row>
    </ColumnGroup>
  );
  useEffect(() => {
    hadleGetRequestDetails();
  }, []);
  return (
    <div>
      {!isNullOrUndefinedOrBlank(selectedRecord) && (
        <>
          <Form
            form={form}
            onFinish={handleFinish}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
          >
            <Form.Item
              name="Qty"
              label="Quantity"
              rules={[
                {
                  required: true,
                  message: 'Quantity is required!',
                },
              ]}
            >
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Space>
                <Button type="primary" htmlType="submit">
                  Update
                </Button>
                <Button type="primary" onClick={() => setSelectedRecord(null)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </>
      )}
      <DataTable
        value={list}
        // tableStyle={{ minWidth: "50rem" }}
        rowsPerPageOptions={[10, 25, 50]}
        emptyMessage="No Records!"
        stripedRows
        size="small"
        footerColumnGroup={footerGroup}
      >
        <Column
          field="action"
          header="Action"
          body={(data: any) => actionBodyTemplate(data)}
        ></Column>

        <Column field="Description" header="Description"></Column>
        <Column field="Qty" header="Qty"></Column>
        <Column field="Price" header="Price"></Column>
        <Column field="Gross" header="Amount"></Column>
        {/* <Column field="Amount" header="Amount"></Column> */}
      </DataTable>
      <div className="flex  justify-end">
        {isNullOrUndefinedOrBlank(selectedRecord) && (
          <>
            <Button
              type="primary"
              onClick={handleSubmit}
              // disabled={!isNullOrUndefinedOrBlank(RenderedBy)}
              className="mt-2"
            >
              Submit
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
