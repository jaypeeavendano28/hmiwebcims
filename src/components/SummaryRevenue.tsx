import { useState } from 'react';
import { Button } from 'antd';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx-js-style';
import { PostData } from '../helpers';

type DataType = {
  Code: string;
  Description: string;
  Revenue: number;
};

export default function SummaryRevenue() {
  const exportCensusRevenue = (data: DataType[]) => {
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

  const [loading, setLoading] = useState(false);
  const handlePrintCencus = async () => {
    try {
      setLoading(true);

      const res = await PostData('GetRecords', {
        sp: 'udp_GetCensusRevenue',
        parameters: {},
      });
      if (res) {
        exportCensusRevenue(res.parameters.lst);
      }
    } catch (error) {
      console.error('Error fetching census data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button type="primary" loading={loading} onClick={handlePrintCencus}>
      Summary Revenue
    </Button>
  );
}
