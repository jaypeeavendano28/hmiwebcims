import { createLazyFileRoute } from '@tanstack/react-router';
import { Button, Card, DatePicker, Form, Select, Table } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import axios from 'axios';
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + '/api/';
const devApi = import.meta.env.VITE_DEV_API + '/api/';
const apiUrl = isDev ? devApi : prodApi;
type TSummaryRevenue = {
  Code: string;
  Description: string;
  Revenue: number;
};

type TBillingChargeCompany = {
  Age: string;
  Amount: number;
  AppointmentId: number;
  MemberNo: string;
  Company: string;
  Date: string;
  Diagnosis: string;
  Name: string;
  TestProcedure: string;
};
type TBillingCash = {
  Age: string;
  Amount: number;
  AppointmentId: number;
  Company: string;
  Date: string;
  Diagnosis: string;
  Name: string;
  TestProcedure: string;
  OrNo: string;
};

type TClaimsTMPH = {
  ServiceCreated: string;
  MemberNo: string;
  Name: string;
  Diagnosis: string;
  Activity: string;
  Doctor: string;
  Spz: string;
  HB: string;
  PF: string;
  Total: string;
};

import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx-js-style';
import { PostData } from '../../helpers';
import { useQuery } from '@tanstack/react-query';
import { THmoCompany, TItems } from '../../types';
import useAppStore from '../../store';
export const Route = createLazyFileRoute('/_authenticated/reports')({
  component: () => <Reports />,
});

// type TReport = {
//   Id: number;
//   Description: string;
//   ReportName: string;
// };

// export default function Reports() {
//   const store = useAppStore();
//   const [selected, setSelected] = useState<TReport | undefined>();
//   const [form] = Form.useForm();
//   const [isProcessing, setIsProcessing] = useState(false);
//   const dataReports: TReport[] = [
//     {
//       Id: 1,
//       Description: 'Appointment List',
//       ReportName: 'appointment_list.rdl',
//     },
//     {
//       Id: 2,
//       Description: "Cashier's Report",
//       ReportName: 'cashiers_report.rdl',
//     },
//   ];

//   const handlePrint = async (v: any) => {
//     console.log(v);
//     setIsProcessing(true);
//     const isDownload = false;
//     const url =
//       apiUrl +
//       'reports/' +
//       store.branchCode +
//       '/' +
//       selected?.ReportName +
//       '/' +
//       dayjs(v.DateFrom).format('YYYY-MM-DD') +
//       '/' +
//       dayjs(v.DateTo).format('YYYY-MM-DD');
//     axios.defaults.headers.common['Authorization'] =
//       'Bearer ' + store.tokenIdWebCims;
//     try {
//       await axios({
//         url: url, //your url
//         method: 'GET',
//         responseType: 'blob',
//       }).then((response: any) => {
//         let newBlob;
//         if (isDownload === false) {
//           newBlob = new Blob([response.data], {
//             type: 'application/pdf',
//           });

//           const data = window.URL.createObjectURL(newBlob);

//           const a = document.createElement('a');

//           a.setAttribute('href', data);
//           a.setAttribute('target', '_blank');

//           a.click();
//           setIsProcessing(false);
//         } else {
//           newBlob = new Blob([response.data], {
//             type: 'application/excel',
//           });
//           const a = document.createElement('a');
//           document.body.appendChild(a);
//           const url = window.URL.createObjectURL(newBlob);
//           a.href = url;
//           a.download = 'download.xls';
//           a.click();
//           setTimeout(() => {
//             window.URL.revokeObjectURL(url);
//             document.body.removeChild(a);
//           }, 0);
//           setIsProcessing(false);
//         }
//       });
//     } catch (error: any) {
//       setIsProcessing(false);
//       let errorString = error.response.data;
//       errorString = JSON.parse(await error.response.data.text());
//       return { Status: 0, Message: errorString.Message };
//     }
//   };

//   useEffect(() => {
//     form.setFieldsValue({
//       DateFrom: dayjs(),
//       DateTo: dayjs(),
//     });
//   }, []);
//   return (
//     <Card title="Reports">
//       <div className=" grid grid-cols-12 gap-4">
//         <div className="col-span-2">
//           <div className="mt-2">
//             <DataTable
//               dataKey="Id"
//               value={dataReports}
//               emptyMessage="No Records"
//               selection={selected}
//               onSelectionChange={(e) => {
//                 const value = e.value as TReport;
//                 setSelected(value);
//               }}
//               rows={20}
//               // selectionMode="rowClick"
//             >
//               <Column selectionMode="single"></Column>

//               <Column field="Description" header="Report Name"></Column>
//             </DataTable>
//           </div>
//         </div>
//         <div className="col-span-2">
//           <Form form={form} layout="vertical" onFinish={handlePrint}>
//             <Form.Item name="DateFrom" label="Date From">
//               <DatePicker format="MM/DD/YYYY" />
//             </Form.Item>
//             <Form.Item name="DateTo" label="Date To">
//               <DatePicker format="MM/DD/YYYY" />
//             </Form.Item>
//             <div className="flex justify-end">
//               <Button
//                 loading={isProcessing}
//                 htmlType="submit"
//                 type="primary"
//                 disabled={!selected}
//               >
//                 Show Report
//               </Button>
//             </div>
//           </Form>
//         </div>
//         <div className="col-span-8"></div>
//       </div>
//     </Card>
//   );
// }

const reportData = [
  {
    key: 'pharmacy-sales-report',
    description: 'Pharmacy Sales Report',
  },
  // {
  //   key: 'pharmacy-daily-sales-report',
  //   description: 'Pharmacy Daily Sales Report',
  // },
  {
    key: 'medical-exams-tests',
    description: 'Medical Exams & Tests Census',
  },
  {
    key: 'summary-revenue',
    description: 'Summary Revenue',
  },
  {
    key: 'billing-charge-to-company',
    description: 'Billing Charge to Company',
  },
  {
    key: 'claims-tmp-h',
    description: 'For Claims TMP-H',
  },
  {
    key: 'cash-all-dept',
    description: 'Cash All Departments',
  },
];
const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<string | undefined>(
    undefined,
  );

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetItems',
        parameters: {},
      });
      return res.parameters.lst as TItems[];
    },
  });

  const { data: hmos } = useQuery({
    queryKey: ['hmos'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetHmoCompany',
        parameters: {},
      });
      return res.parameters.lst as THmoCompany[];
    },
  });
  const itemOptions =
    items?.map((item) => ({
      label: item.Description ?? item.Id,
      value: item.Id,
    })) ?? [];
  const companyOptions =
    hmos
      ?.filter((item) => item.Type === 'C')
      .map((item) => ({
        label: item.Name ?? item.Id,
        value: item.Id,
      })) ?? [];
  const getSelectedIds = (selectedIds?: number[]) =>
    selectedIds?.length ? selectedIds.join(',') : '';

  const handleExportExcel = async (values: any) => {
    setLoading(true);
    try {
      const [from, to] = values.date;
      switch (selectedReport) {
        case 'medical-exams-tests': {
          const res = await axios.post(
            `${apiUrl}census-medical-exam-test`,
            Array.isArray(values.items) ? values.items : [],
            {
              headers: { 'Content-Type': 'application/json' },
              params: {
                dateFrom: dayjs(from).format('MM/DD/YYYY'),
                dateTo: dayjs(to).format('MM/DD/YYYY'),
              },
            },
          );

          if (res) {
            printMedicalExamTest(res.data.parameters);
          }
          break;
        }

        case 'summary-revenue': {
          const res = await PostData('GetRecords', {
            sp: 'udp_GetCensusRevenue',
            parameters: {
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              BranchCode: store.branchCode,
            },
          });

          if (res) {
            printSummaryRevenue(res.parameters.lst);
          }
          break;
        }
        case 'pharmacy-sales-report': {
          const res = await PostData('GetRecords', {
            sp: 'udp_GetPharmacySalesReport',
            parameters: {
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              BranchCode: store.branchCode,
            },
          });

          if (res) {
            printPharmacySaleReport(
              dayjs(from).format('YYYY-MM-DD'),
              dayjs(to).format('YYYY-MM-DD'),
              res.parameters.lst,
            );
          }
          break;
        }
        case 'pharmacy-daily-sales-report': {
          const res = await PostData('GetRecords', {
            sp: 'udp_GetPharmacySalesDailyReport',
            parameters: {
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              BranchCode: store.branchCode,
            },
          });

          if (res) {
            printPharmacyDailySalesReport(
              dayjs(from).format('YYYY-MM-DD'),
              dayjs(to).format('YYYY-MM-DD'),
              res.parameters.lst,
            );
          }
          break;
        }

        case 'billing-charge-to-company': {
          const [from, to] = values.date;

          const res = await PostData('GetRecords', {
            sp: 'udp_GetBillingToCompany',
            parameters: {
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              BranchCode: store.branchCode,
              itemsIds: getSelectedIds(values.items),
              hmoIds: getSelectedIds(values.hmo),
            },
          });

          if (res) {
            printBillingToCompany(res.parameters.lst);
          }
          break;
        }

        case 'claims-tmp-h': {
          const [from, to] = values.date;

          const res = await PostData('GetRecords', {
            sp: 'udp_GetClaimsTmph',
            parameters: {
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              BranchCode: store.branchCode,
            },
          });

          if (res) {
            printClaimsTMPH(res.parameters.lst);
          }
          break;
        }

        case 'cash-all-dept': {
          const [from, to] = values.date;

          const res = await PostData('GetRecords', {
            sp: 'udp_GetBillingCash',
            parameters: {
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              BranchCode: store.branchCode,
              ItemsIds: getSelectedIds(values.items),
              HmoIds: getSelectedIds(values.hmo),
            },
          });

          if (res) {
            printBillingCash(res.parameters.lst);
            console.log(res.parameters.lst);
          }
          break;
        }

        default:
          console.warn('Unknown report type:', selectedReport);
      }
    } catch (error) {
      console.error('Error fetching census data:', error);
    } finally {
      setLoading(false);
    }
  };

  const store = useAppStore();

  const handleGenerateReport = async (values: any) => {
    setLoading(true);
    try {
      const [from, to] = values.date;
      axios.defaults.headers.common['Authorization'] =
        'Bearer ' + store.tokenIdWebCims;

      const url = apiUrl + 'GenerateReport';
      switch (selectedReport) {
        case 'summary-revenue': {
          await axios({
            url: url,
            method: 'GET',
            responseType: 'blob',
            params: {
              ReportName: 'SummaryRevenue.rdl',
              BranchCode: store.branchCode,
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
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
          });
          break;
        }
        case 'pharmacy-sales-report': {
          await axios({
            url: url,
            method: 'GET',
            responseType: 'blob',
            params: {
              ReportName: 'PharmacyReport.rdl',
              BranchCode: store.branchCode,
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              Type: store.userId,
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
          });
          break;
        }
        case 'pharmacy-daily-sales-report': {
          await axios({
            url: url,
            method: 'GET',
            responseType: 'blob',
            params: {
              ReportName: 'PharmacyDailySalesReport.rdl',
              BranchCode: store.branchCode,
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              Type: store.userId,
            },
          }).then((response) => {
            const data = window.URL.createObjectURL(
              new Blob([response.data], { type: 'application/pdf' }),
            );
            const anchor = document.createElement('a');
            anchor.setAttribute('href', data);
            anchor.setAttribute('target', '_blank');
            anchor.click();
          });
          break;
        }

        case 'billing-charge-to-company': {
          await axios({
            url: url,
            method: 'GET',
            responseType: 'blob',
            params: {
              ReportName: 'BillingChargeToCompany.rdl',
              BranchCode: store.branchCode,
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              ItemsIds: getSelectedIds(values.items),
              HmoIds: getSelectedIds(values.hmo),
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
          });
          break;
        }

        case 'claims-tmp-h': {
          await axios({
            url: url,
            method: 'GET',
            responseType: 'blob',
            params: {
              ReportName: 'ForClaimsTPH.rdl',
              BranchCode: store.branchCode,
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
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
          });
          break;
        }

        case 'cash-all-dept': {
          await axios({
            url: url,
            method: 'GET',
            responseType: 'blob',
            params: {
              ReportName: 'CashAllDept.rdl',
              BranchCode: store.branchCode,
              dateFrom: dayjs(from).format('MM/DD/YYYY'),
              dateTo: dayjs(to).format('MM/DD/YYYY'),
              ItemsIds: getSelectedIds(values.items),
              HmoIds: getSelectedIds(values.hmo),
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
          });
          break;
        }

        default:
          console.warn('Unknown report type:', selectedReport);
      }
    } catch (error) {
      console.error('Error fetching census data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="grid items-start gap-2 md:grid-cols-3">
      <Card className="md:order-2">
        {selectedReport ? (
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{
              date: [dayjs(), dayjs()],
            }}
            onFinish={handleExportExcel}
          >
            <Form.Item
              name="date"
              label="Date"
              className="!mb-3"
              rules={[
                {
                  required: true,
                  message: 'Please select date range',
                },
              ]}
            >
              <DatePicker.RangePicker format="MM/DD/YYYY" className="!w-full" />
            </Form.Item>

            {(selectedReport === 'medical-exams-tests' ||
              selectedReport === 'billing-charge-to-company' ||
              selectedReport === 'cash-all-dept') && (
              <>
                <Form.Item name="items" label="Items" className="!mb-3">
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder="All items"
                    options={itemOptions}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </>
            )}
            {selectedReport === 'billing-charge-to-company' && (
              <>
                <Form.Item name="hmo" label="Companies" className="!mb-3">
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder="All companies"
                    options={companyOptions}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </>
            )}
            {selectedReport === 'cash-all-dept' && (
              <>
                <Form.Item name="hmo" label="Companies" className="!mb-3">
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    placeholder="All companies"
                    options={companyOptions}
                    optionFilterProp="label"
                  />
                </Form.Item>
              </>
            )}

            <div
              className={
                selectedReport === 'medical-exams-tests'
                  ? 'grid grid-cols-1 gap-1'
                  : 'grid grid-cols-2 gap-1'
              }
            >
              <Button type="primary" htmlType="submit" loading={loading}>
                Export Excel
              </Button>
              {selectedReport !== 'medical-exams-tests' && (
                <Button
                  type="primary"
                  loading={loading}
                  onClick={async () => {
                    const values = await form.validateFields();
                    handleGenerateReport(values);
                  }}
                >
                  Generate Report
                </Button>
              )}
            </div>
          </Form>
        ) : (
          <div className="uppercase text-xs font-bold text-slate-400 text-center">
            Please select report
          </div>
        )}
      </Card>
      <div className="md:col-span-2">
        <Table
          dataSource={reportData}
          onRow={(record) => ({
            onClick() {
              setSelectedReport(record.key);
            },
          })}
          rowSelection={{
            renderCell: () => null,
            hideSelectAll: true,
            columnWidth: 0,
            selectedRowKeys: selectedReport ? [selectedReport] : [],
          }}
          rowClassName="cursor-pointer"
          columns={[
            {
              title: 'Report Name',
              dataIndex: 'description',
              key: 'description',
            },
          ]}
          pagination={false}
        />
      </div>
    </div>
  );
};

const printMedicalExamTest = async (census: any) => {
  const ws = XLSX.utils.aoa_to_sheet([]);

  const days: string[] = Object.keys(census.Items[0].DailyCounts).sort();

  const border = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  };

  const headerStyle = {
    font: { bold: true },
    alignment: { horizontal: 'center', vertical: 'center' },
    border,
  };

  const normalCell = {
    alignment: { horizontal: 'center' },
    border,
  };

  const boldCell = {
    alignment: { horizontal: 'center' },
    font: { bold: true },
    border,
  };

  const descStyle = {
    alignment: { horizontal: 'left' },
    border,
  };

  const monthGroups: Record<string, string[]> = {};

  days.forEach((d) => {
    const key = dayjs(d).format('MMMM YYYY');
    if (!monthGroups[key]) monthGroups[key] = [];
    monthGroups[key].push(d);
  });

  const monthHeaderRow: any[] = [
    { v: 'Description', s: headerStyle },
    { v: 'Total', s: headerStyle },
  ];

  Object.entries(monthGroups).forEach(([month, dates]) => {
    monthHeaderRow.push({ v: month, s: headerStyle });

    // fillers for merge
    for (let i = 1; i < dates.length; i++) {
      monthHeaderRow.push({ v: '', s: headerStyle });
    }
  });

  XLSX.utils.sheet_add_aoa(ws, [monthHeaderRow], { origin: 'A1' });

  ws['!merges'] = ws['!merges'] || [];

  let colIndex = 2;

  Object.values(monthGroups).forEach((dates) => {
    ws['!merges']!.push({
      s: { r: 0, c: colIndex },
      e: { r: 0, c: colIndex + dates.length - 1 },
    });
    colIndex += dates.length;
  });

  const dayHeaderRow: any[] = [
    { v: '', s: headerStyle },
    { v: '', s: headerStyle },
  ];

  days.forEach((d) => {
    dayHeaderRow.push({
      v: dayjs(d).format('DD'),
      s: headerStyle,
    });
  });

  XLSX.utils.sheet_add_aoa(ws, [dayHeaderRow], { origin: 'A2' });

  const dataRows = census.Items.map((item: any) => [
    { v: item.Description, s: descStyle },
    {
      v: item.Total,
      s: item.Total !== 0 ? boldCell : normalCell,
    },
    ...days.map((d) => {
      const value = item.DailyCounts[d] ?? 0;
      return {
        v: value === 0 ? '' : value,
        s: value !== 0 ? boldCell : normalCell,
      };
    }),
  ]);

  XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A3' });

  ws['!freeze'] = { ySplit: 2, xSplit: 2 };

  ws['!cols'] = [{ wch: 35 }, { wch: 10 }, ...days.map(() => ({ wch: 6 }))];

  const wb = XLSX.utils.book_new();

  const dateFrom = dayjs(days[0]);
  const dateTo = dayjs(days[days.length - 1]);

  const sheetName = `${dateFrom.format('MMM DD')}–${dateTo.format(
    'MMM DD YYYY',
  )}`;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `Census_${dateFrom.format('YYYYMMDD')}_${dateTo.format('YYYYMMDD')}.xlsx`,
  );
};

const printSummaryRevenue = (data: TSummaryRevenue[]) => {
  const rows = data.map((item) => [item.Description, item.Revenue]);

  const grandTotal = data.reduce((sum, item) => sum + item.Revenue, 0);

  const sheetData = [
    ['Census Revenue Summary', ''],
    ['Row Labels', 'Revenue'],
    ...rows,
    ['Grand Total', grandTotal],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [{ wch: 25 }, { wch: 15 }];
  ws['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 1 },
    },
  ];

  const titleStyle = {
    font: { bold: true, sz: 14 },
  };

  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: 'D9EAF7' } },
    border: {
      bottom: { style: 'thin' },
    },
  };

  const currencyStyle = {
    numFmt: '#,##0.00',
  };

  const totalStyle = {
    font: { bold: true },
    numFmt: '"₱"#,##0.00',
    border: {
      top: { style: 'thin' },
    },
  };

  ws['A1'].s = titleStyle;

  ws['A2'].s = headerStyle;
  ws['B2'].s = headerStyle;

  rows.forEach((_, i) => {
    const row = i + 3;
    ws[`B${row}`].s = currencyStyle;
  });

  const totalRow = rows.length + 3;
  ws[`A${totalRow}`].s = { font: { bold: true } };
  ws[`B${totalRow}`].s = totalStyle;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Census Revenue Summary');

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });
  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `Summary Revenue.xlsx`,
  );
};

const printBillingToCompany = (data: TBillingChargeCompany[]) => {
  const rows = data.map((item) => [
    dayjs(item.Date).format('MMM D, YYYY h:mm A'),
    item.Name,
    item.Age,
    item.AppointmentId,
    item.MemberNo,
    item.Company,
    item.Diagnosis,
    item.TestProcedure,
    item.Amount,
  ]);

  const sheetData = [
    [
      'Date',
      'Name',
      'Age',
      'Appointment Id',
      'Member No',
      'Company',
      'Diagnosis',
      'Test/Procedure',
      'Amount',
    ],
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 25 },
    { wch: 40 },
    { wch: 17 },
    { wch: 16 },
    { wch: 16 },
    { wch: 56 },
    { wch: 29 },
    { wch: 37 },
    { wch: 17 },
  ];

  const headers = sheetData[0];

  headers.forEach((_, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'D9EAF7' } },
    };
  });

  const amountColIndex = 7;

  for (let r = 1; r < sheetData.length; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: amountColIndex });
    if (!ws[cellAddress]) continue;

    ws[cellAddress].s = {
      numFmt: '#,##0.00',
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Census Revenue Summary');

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });
  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `Billing-Charge to Company.xlsx`,
  );
};

const printBillingCash = (data: TBillingCash[]) => {
  const rows = data.map((item) => [
    dayjs(item.Date).format('MMM D, YYYY h:mm A'),
    item.Name,
    item.Age,
    item.AppointmentId,
    item.Company,
    item.Diagnosis,
    item.TestProcedure,
    item.OrNo,
    item.Amount,
  ]);

  const sheetData = [
    [
      'Date',
      'Name',
      'Age',
      'AppointmentId',
      'Company',
      'Diagnosis',
      'Test/Procedure',
      'O.R No.',
      'Amount',
    ],
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 25 },
    { wch: 40 },
    { wch: 17 },
    { wch: 16 },
    { wch: 56 },
    { wch: 29 },
    { wch: 37 },
    { wch: 17 },
    { wch: 17 },
  ];

  const headers = sheetData[0];

  headers.forEach((_, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'D9EAF7' } },
    };
  });

  const amountColIndex = 7;

  for (let r = 1; r < sheetData.length; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: amountColIndex });
    if (!ws[cellAddress]) continue;

    ws[cellAddress].s = {
      numFmt: '#,##0.00',
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cash All Departments');

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });
  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `Cash All Departments.xlsx`,
  );
};
const printClaimsTMPH = (data: TClaimsTMPH[]) => {
  const rows = data.map((item) => [
    dayjs(item.ServiceCreated).format('MMM D, YYYY h:mm A'),
    item.MemberNo,
    item.Name,
    item.Diagnosis,
    item.Activity,
    item.Doctor,
    item.Spz,
    item.HB,
    item.PF,
    item.Total,
  ]);

  const sheetData = [
    [
      'Service Created',
      'MemNo',
      'Name',
      'Diagnosis',
      'Activity',
      'Doctor',
      'Spz',
      'HB',
      'PF',
      'Total',
    ],
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 30 },
    { wch: 19 },
    { wch: 31 },
    { wch: 40 },
    { wch: 40 },
    { wch: 50 },
    { wch: 50 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  const headers = sheetData[0];

  headers.forEach((_, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'D9EAF7' } },
    };
  });

  const amountColIndex = 7;

  for (let r = 1; r < sheetData.length; r++) {
    const cellAddress = XLSX.utils.encode_cell({ r, c: amountColIndex });
    if (!ws[cellAddress]) continue;

    ws[cellAddress].s = {
      numFmt: '#,##0.00',
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'For Claims-TMP-H');

  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });
  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `For Claims-TMP-H.xlsx`,
  );
};

const printPharmacyDailySalesReport = (
  dateFrom: string,
  dateTo: string,
  data: any[],
) => {
  const headers = [
    'Date',
    'VAT Sales',
    'VAT',
    'Net of VAT',
    'Non-VAT Sales',
    'Senior Disc',
    'Service Charge',
  ];
  const rows = data.map((item) => [
    dayjs(item.SaleDate).format('YYYY-MM-DD'),
    Number(item.VatSales ?? 0),
    Number(item.Vat ?? 0),
    Number(item.NetOfVat ?? 0),
    Number(item.NonVatSales ?? 0),
    Number(item.SeniorDiscount ?? 0),
    Number(item.ServiceCharge ?? 0),
  ]);
  const totals = headers.map((_, columnIndex) =>
    columnIndex === 0
      ? 'Total'
      : rows.reduce((total, row) => total + Number(row[columnIndex] ?? 0), 0),
  );
  const sheetData = [
    ['Sales Daily Report'],
    ['Print Out Date:', dayjs().format('YYYY-MM-DD hh:mm A')],
    [
      'Period:',
      `${dayjs(dateFrom).format('YYYY-MM-DD')} - ${dayjs(dateTo).format('YYYY-MM-DD')}`,
    ],
    [],
    headers,
    ...rows,
    totals,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const range = XLSX.utils.decode_range(ws['!ref']!);
  const border = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  };

  ws['A1'].s = { font: { bold: true, sz: 14 } };
  for (let column = 0; column < headers.length; column++) {
    const headerCell = ws[XLSX.utils.encode_cell({ r: 4, c: column })];
    headerCell.s = {
      font: { bold: true },
      border,
      alignment: { horizontal: 'center' },
      fill: { fgColor: { rgb: 'E5E7EB' } },
    };
  }

  for (let row = 5; row <= range.e.r; row++) {
    for (let column = 0; column < headers.length; column++) {
      const cell = ws[XLSX.utils.encode_cell({ r: row, c: column })];
      if (!cell) continue;
      cell.s = {
        ...(cell.s ?? {}),
        border,
        ...(column > 0 ? { numFmt: '#,##0.00' } : {}),
        ...(row === range.e.r ? { font: { bold: true } } : {}),
      };
    }
  }

  ws['!cols'] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales');
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    'Pharmacy Daily Sales Report.xlsx',
  );
};

const printPharmacySaleReport = (
  dateFrom: string,
  dateTo: string,
  data: any[],
) => {
  const wsData: any[][] = [];

  // HEADER
  wsData.push(['Sales Detail Report']);
  wsData.push(['Print Out Date:', dayjs().format('YYYY-MM-DD h:mm A')]);
  wsData.push([
    'Period:',
    `${dayjs(dateFrom).format('YYYY-MM-DD')} - ${dayjs(dateTo).format('YYYY-MM-DD')}`,
  ]);
  wsData.push([]);

  const headers = [
    'Date',
    'Receipt',
    'Description',
    'Qty',
    'Discount',
    'Selling Price',
    'Unit Cost',
    'Profit',
    'Payment',
    'Cashier',
  ];

  wsData.push(headers);

  // GROUP BY DATE
  const grouped = data.reduce<Record<string, any[]>>((acc, item) => {
    const key = dayjs(item.DateStr).format('YYYY-MM-DD');

    (acc[key] ??= []).push(item);

    return acc;
  }, {});

  let grandSales = 0;
  let grandProfit = 0;
  let grandPayment = 0;

  // LOOP GROUPS
  Object.entries(grouped).forEach(([date, items]) => {
    // DATE HEADER
    wsData.push([date]);

    let subSales = 0;
    let subProfit = 0;
    let subPayment = 0;

    // ITEMS
    items.forEach((item) => {
      const sales = Number(item.Sales || 0);
      const profit = Number(item.Profit || 0);
      const payment = Number(item.Payment || 0);
      const unitCost = Number(item.UnitCost || 0);
      const discount = Number(item.Discount || 0);

      wsData.push([
        dayjs(item.DateStr).format('YYYY-MM-DD'),
        item.OrNo ?? '',
        item.Description ?? '',
        Number(item.Qty || 0),
        discount,
        sales,
        unitCost,
        profit,
        payment,
        item.Cashier ?? '',
      ]);

      subSales += sales;
      subProfit += profit;
      subPayment += payment;
    });

    // SUB TOTAL
    wsData.push([
      'Total',
      '',
      '',
      '',
      '',
      subSales,
      '',
      subProfit,
      subPayment,
      '',
    ]);

    wsData.push([]);

    grandSales += subSales;
    grandProfit += subProfit;
    grandPayment += subPayment;
  });

  // GRAND TOTAL
  wsData.push([
    'GRAND TOTAL',
    '',
    '',
    '',
    '',
    grandSales,
    '',
    grandProfit,
    grandPayment,
    '',
  ]);

  // CREATE SHEET
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // STYLES
  const moneyStyle = {
    numFmt: '#,##0.00',
  };

  const bold = {
    font: { bold: true },
  };

  const border = {
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  // TITLE STYLE
  if (ws['A1']) {
    ws['A1'].s = {
      font: {
        bold: true,
        sz: 14,
      },
    };
  }

  // HEADER STYLE
  headers.forEach((_, i) => {
    const cell = XLSX.utils.encode_cell({ r: 4, c: i });

    if (ws[cell]) {
      ws[cell].s = {
        ...bold,
        ...border,
        alignment: {
          horizontal: 'center',
        },
      };
    }
  });

  // APPLY MONEY FORMAT
  const range = XLSX.utils.decode_range(ws['!ref']!);

  for (let r = 5; r <= range.e.r; r++) {
    [5, 6, 7, 8, 9].forEach((c) => {
      const ref = XLSX.utils.encode_cell({ r, c });

      if (ws[ref] && typeof ws[ref].v === 'number') {
        ws[ref].s = {
          ...(ws[ref].s || {}),
          ...moneyStyle,
        };
      }
    });
  }

  // COLUMN WIDTHS
  ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Receipt
    { wch: 60 }, // Description
    { wch: 6 }, // Qty
    { wch: 10 }, // Discount
    { wch: 12 }, // Sales
    { wch: 12 }, // Unit Cost
    { wch: 12 }, // Profit
    { wch: 12 }, // Payment
    { wch: 25 }, // Cashier
  ];

  // CREATE WORKBOOK
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, 'Sales Detail Report');

  // EXPORT
  const buffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
  });

  saveAs(
    new Blob([buffer], {
      type: 'application/octet-stream',
    }),
    'Pharmacy Report.xlsx',
  );
};
