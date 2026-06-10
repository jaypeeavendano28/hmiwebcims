import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createLazyFileRoute } from '@tanstack/react-router';
import { isNullOrUndefinedOrBlank, PostData } from '../../helpers';
import { TAccountsReceivable, TArPayments } from '../../types';
import { DataTable } from 'primereact/datatable';
import { useState } from 'react';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Popconfirm,
  Space,
  Switch,
  Tooltip,
} from 'antd';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { FaPesoSign } from 'react-icons/fa6';
import dayjs from 'dayjs';
import ChargesPerAppointment from '../../components/ChargesPerAppointment';
import { FaRegEdit } from 'react-icons/fa';
import { MdDeleteOutline } from 'react-icons/md';
import useAppStore from '../../store';
import axios from 'axios';

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

export const Route = createLazyFileRoute('/_authenticated/ardetails/$Id')({
  component: () => <ArDetails />,
});

const ArDetails = () => {
  const [lstArDetails, setLstArDetails] = useState<
    TAccountsReceivable[] | undefined
  >();
  const [expandedRows, setExpandedRows] = useState<
    TAccountsReceivable | undefined
  >();
  const [expandedRowsPayments, setExpandedRowsPayments] = useState<
    TArPayments | undefined
  >();
  const [formSearch] = Form.useForm();
  const q = useQueryClient();
  const [form] = Form.useForm();
  const [ArPayments, setArPayments] = useState<TArPayments[] | undefined>();
  const [rowId, setRowId] = useState(0);
  const [selected, setSelected] = useState<TAccountsReceivable | null>(null);
  const [isDelete, setIsDeleted] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);

  const [isProcessing, setIsProccessing] = useState(false);
  const store = useAppStore();

  const [filters] = useState({
    PatientName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    AppointmentType: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const { Id } = Route.useParams();
  const details = useQuery({
    queryKey: ['details'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetHmoCompanyDetails',
        parameters: { Id },
      });
      if (res) {
        return res.parameters.lst[0];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const withBalanceOnly = isNullOrUndefinedOrBlank(
    formSearch.getFieldValue('WithBalanceOnly'),
  )
    ? 'Y'
    : formSearch.getFieldValue('WithBalanceOnly');
  const handleGetList = async () => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetArDetails',
        parameters: {
          Id,
          WithBalanceOnly: withBalanceOnly === true ? 'Y' : 'N',
          DateFrom: formSearch.getFieldValue('DateFrom').format('YYYY-MM-DD'),
          DateTo: formSearch.getFieldValue('DateTo').format('YYYY-MM-DD'),
        },
      });
      if (res) {
        setLstArDetails(res.parameters.lst);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const actionBodyTemplate = (data: TAccountsReceivable) => {
    return (
      <Space>
        <Tooltip title="Payment details">
          <FaPesoSign
            size={16}
            className="cursor-pointer"
            onClick={() => {
              setSelected(data);
              setShowModal(true);
              handleGetArPayments(data.Id);
            }}
          />
        </Tooltip>
      </Space>
    );
  };

  const actionBodyTemplate2 = (data: TArPayments) => {
    if (rowId > 0) return null;
    return (
      <Space>
        <Tooltip title="Edit">
          <FaRegEdit
            size={16}
            className="cursor-pointer"
            onClick={() => {
              setRowId(data.Id);
              console.log(data);
              form.setFieldsValue({
                Date: dayjs(data.Date),
                Amount: data.Amount,
                Reference: data.Reference,
                Ewt: data.Ewt,
              });
            }}
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Popconfirm
            okText="Yes"
            cancelText="No"
            title="Delete this payment?"
            onConfirm={() => {
              setRowId(data.Id);
              setIsDeleted(true);
              handleDeletePayment(data.Id);
            }}
          >
            <MdDeleteOutline size={16} className="cursor-pointer" />
          </Popconfirm>
        </Tooltip>
      </Space>
    );
  };
  const totalBalance = () => {
    let total = 0;
    if (!lstArDetails) return 0;
    for (let sale of lstArDetails!) {
      total += sale.Balance!;
    }
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const totalPayments = () => {
    let total = 0;
    if (!lstArDetails) return 0;
    for (let sale of lstArDetails!) {
      total += sale.Payment!;
    }
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const totalAmount = () => {
    let total = 0;
    if (!lstArDetails) return 0;
    for (let sale of lstArDetails!) {
      total += sale.Amount!;
    }
    return total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const bodyBalance = (rowData: TAccountsReceivable) => {
    return rowData.Balance?.toLocaleString(undefined, {
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
            textAlign: 'right',
            fontWeight: 'bold',
          }}
        />
        <Column className="text-lg text-right" footer={totalAmount} />
        <Column className="text-lg text-right" footer={totalPayments} />
        <Column className="text-lg text-right" footer={totalBalance} />
      </Row>
    </ColumnGroup>
  );
  const handleSubmit = async (values: any) => {
    if (!isDelete) {
      if (values.Amount > selected!.Balance!) {
        notification.error({
          message: 'Amount must not be greater than balance!',
          placement: 'topRight',
          duration: 3,
        });
      }
    }

    const res = await PostData('SaveArPayment', {
      fk_AccountsReceivable_Id: selected?.Id,
      Date: values.Date.format('YYYY-MM-DD'),
      Amount: values.Amount,
      Id: rowId,
      HmoCompany: details.data?.Id,
      Reference: values.Reference,
      IsDelete: isDelete,
      Ewt: isNullOrUndefinedOrBlank(values.EWT) ? 0 : values.EWT,
    });
    if (res) {
      form.resetFields();
      setShowModal(false);
      handleGetList();
      setRowId(0);
      setIsDeleted(false);
    }
  };

  const handleDeletePayment = async (Id: number) => {
    const res = await PostData('SaveArPayment', {
      Id,
      IsDelete: true,
    });
    if (res) {
      form.resetFields();
      setShowModal(false);
      await q.refetchQueries({
        queryKey: ['lstArDetails'],
      });
      setRowId(0);
      setIsDeleted(false);
    }
  };

  const handleSearch = async () => {
    handleGetList();
  };
  const rowExpansionTemplate = (data: TAccountsReceivable) => {
    if (isNullOrUndefinedOrBlank(data.AppointmentId)) return null;
    return <ChargesPerAppointment AppointmentId={data.AppointmentId!} />;
  };

  const rowExpansionTemplate2 = (data: TArPayments) => {
    if (isNullOrUndefinedOrBlank(data)) return null;
    return (
      <>
        <div className="grid grid-cols-3">
          <div>
            <div>Added By</div>
            <div className="font-bold">{data.AddedBy}</div>
            <div>Date Added</div>
            <div className="font-bold">{data.DateAdded}</div>
          </div>
          <div>
            <div>Updated By</div>
            <div className="font-bold">{data.UpdatedBy}</div>
            <div>Date Updated</div>
            <div className="font-bold">{data.DateUpdated}</div>
          </div>
          <div>
            <div>Deleted By</div>
            <div className="font-bold">{data.DeletedBy}</div>
            <div>Date Deleted</div>
            <div className="font-bold">{data.DateDeleted}</div>
          </div>
        </div>
      </>
    );
  };

  const saveAsExcelFile = (buffer: any, fileName: any) => {
    import('file-saver').then((module) => {
      if (module && module.default) {
        let EXCEL_TYPE =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        let EXCEL_EXTENSION = '.xlsx';
        const data = new Blob([buffer], {
          type: EXCEL_TYPE,
        });

        module.default.saveAs(
          data,
          fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION,
        );
      }
    });
  };
  const exportExcel = () => {
    import('xlsx').then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(lstArDetails!);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      saveAsExcelFile(excelBuffer, 'ARDetails');
    });
  };

  const handleGetArPayments = async (rowId: number) => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetArPayments',
      parameters: {
        Id: rowId,
      },
    });
    if (res) {
      setArPayments(res.parameters.lst);
    }
  };

  const handlePrint = async () => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport';
    try {
      setIsProccessing(true);
      await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'ARDetails.rdl',
          AppointmentId: Id,
          Type: withBalanceOnly === true ? 'Y' : 'N',
          DateFrom: formSearch.getFieldValue('DateFrom').format('YYYY-MM-DD'),
          DateTo: formSearch.getFieldValue('DateTo').format('YYYY-MM-DD'),
          BranchCode: store.branchCode,
        },
      }).then((response) => {
        let newBlob;
        newBlob = new Blob([response.data], {
          type: 'application/pdf',
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement('a');

        a.setAttribute('href', data);
        a.setAttribute('target', '_blank');

        a.click();
        // setIsSubmitting(false);
      });
    } catch (error: any) {
      // setIsSubmitting(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    } finally {
      setIsProccessing(false);
    }
  };

  return (
    <>
      <div className="text-center text-xl">Accounts Receivable Details</div>

      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <div className="flex">
            Name:<p className="font-bold">{details.data?.Name}</p>
          </div>
        </div>
        <div className="col-span-6">
          <div className="flex">
            Balance:
            <p className="font-bold">
              {details.data?.Balance?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>
      <Form
        form={formSearch}
        layout="inline"
        onFinish={handleSearch}
        initialValues={{
          WithBalanceOnly: true,
          DateFrom: dayjs().startOf('M'),
          DateTo: dayjs(),
        }}
      >
        <Form.Item name="WithBalanceOnly" noStyle>
          <Switch
            checkedChildren="With balance only"
            unCheckedChildren="All"
            onChange={handleSearch}
          />
        </Form.Item>
        <Form.Item name="DateFrom" label="Appointment Date From">
          <DatePicker format="MM/DD/YYYY" onChange={handleSearch} />
        </Form.Item>
        <Form.Item name="DateTo" label="To">
          <DatePicker format="MM/DD/YYYY" onChange={handleSearch} />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Refresh List
        </Button>
      </Form>

      <div className="mt-2">
        <div className="flex gap-x-2">
          <Button type="primary" onClick={exportExcel}>
            Export to excel
          </Button>
          <Button type="primary" loading={isProcessing} onClick={handlePrint}>
            Generate Report
          </Button>
        </div>

        <DataTable
          value={lstArDetails!}
          tableStyle={{ minWidth: '50rem' }}
          paginator
          rows={25}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          filters={filters}
          filterDisplay="row"
          footerColumnGroup={footerGroup}
          rowExpansionTemplate={rowExpansionTemplate}
          expandedRows={expandedRows as any}
          onRowToggle={(e) => setExpandedRows(e.data as any)}
        >
          <Column
            expander={lstArDetails && lstArDetails.length > 0}
            style={{ width: '5rem' }}
          />
          <Column
            field="AppointmentId"
            header="Appointment Id"
            style={{ width: '100px' }}
          ></Column>
          <Column
            field="AppointmentType"
            header="Appointment Type"
            filter
            style={{ width: '200px' }}
          ></Column>
          <Column
            field="Date"
            header="Date"
            body={(data: any) => dayjs(data.Date).format('MM/DD/YYYY')}
          ></Column>
          <Column field="PatientName" header="Patient Name" filter></Column>
          <Column
            field="Amount"
            header="Amount"
            alignHeader={'right'}
            className="text-right"
            body={(data: TAccountsReceivable) =>
              data.Amount?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
          <Column
            field="Payment"
            header="Payments"
            alignHeader={'right'}
            className="text-right"
            body={(data: TAccountsReceivable) =>
              data.Payment?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
          <Column
            field="Balance"
            header="Balance"
            alignHeader={'right'}
            className="text-right"
            body={bodyBalance}
          ></Column>
          <Column field="Age" header="Age"></Column>

          <Column
            field="action"
            header="Action"
            body={(data: any) => actionBodyTemplate(data)}
          ></Column>
        </DataTable>
      </div>
      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        destroyOnClose
        width={1000}
      >
        <div className="text-center font-bold mb-2">Payment Details</div>
        <p className="font-bold mb-2">
          HMO/Company:
          {details.data?.Name}
        </p>
        <p className="font-bold mb-2">
          Patient Name:
          {selected?.PatientName}
        </p>
        <p className="font-bold mb-2">
          Balance:
          {selected?.Balance?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <Form form={form} onFinish={handleSubmit} layout="inline">
          <Form.Item
            label="Date"
            name="Date"
            rules={[{ required: true, message: 'Date is required!' }]}
          >
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
          <Form.Item
            label="Amount Paid"
            name="Amount"
            rules={[{ required: true, message: 'Amount is required!' }]}
          >
            <InputNumber precision={2} />
          </Form.Item>
          <Form.Item label="EWT" name="Ewt">
            <InputNumber precision={2} />
          </Form.Item>
          <Form.Item name="Reference" label="Reference">
            <Input />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>

            {rowId > 0 && (
              <Button
                type="primary"
                onClick={() => {
                  setRowId(0);
                  form.resetFields();
                }}
                danger
              >
                Cancel Edit
              </Button>
            )}
          </Space>

          <DataTable
            value={ArPayments}
            tableStyle={{ minWidth: '50rem' }}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filters={filters}
            filterDisplay="row"
            rowExpansionTemplate={rowExpansionTemplate2}
            expandedRows={expandedRowsPayments as any}
            onRowToggle={(e) => setExpandedRowsPayments(e.data as any)}
          >
            <Column
              expander={ArPayments && ArPayments.length > 0}
              style={{ width: '5rem' }}
            />
            <Column
              field="DateStr"
              header="Date"
              style={{ width: '100px' }}
            ></Column>
            <Column
              field="Reference"
              header="Reference"
              style={{ width: '200px' }}
            ></Column>
            <Column
              field="Amount"
              header="Amount"
              style={{ width: '200px' }}
            ></Column>
            <Column
              field="Ewt"
              header="EWT"
              style={{ width: '200px' }}
            ></Column>
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate2(data)}
            ></Column>
          </DataTable>
        </Form>
      </Modal>
    </>
  );
};
