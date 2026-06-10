import { Button } from 'antd';
import { useState } from 'react';
import { PostData } from '../helpers';
import * as XLSX from 'xlsx-js-style';
import saveAs from 'file-saver';
import dayjs from 'dayjs';

type DataType = {
  Age: string;
  Amount: number;
  AppointmentId: number;
  Company: string;
  Date: string;
  Diagnosis: string;
  Name: string;
  TestProcedure: string;
};

export default function BillingChargeToCompany() {
  const [loading, setLoading] = useState(false);

  const exportBillingToCompany = (data: DataType[]) => {
    const rows = data.map((item) => [
      dayjs(item.Date).format('MMM D, YYYY h:mm A'),
      item.Name,
      item.Age,
      item.AppointmentId,
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
        'AppointmentId',
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

  const handlePrintCencus = async () => {
    try {
      setLoading(true);

      const res = await PostData('GetRecords', {
        sp: 'udp_GetBillingToCompany',
        parameters: {},
      });
      if (res) {
        exportBillingToCompany(res.parameters.lst);
        console.log(res.parameters.lst);
      }
    } catch (error) {
      console.error('Error fetching census data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button type="primary" onClick={handlePrintCencus} loading={loading}>
      Billing Charge to Company
    </Button>
  );
}
