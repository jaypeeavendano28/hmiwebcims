import { useState } from 'react';
import { Button, DatePicker, Form, Popover } from 'antd';
import { saveAs } from 'file-saver';
import axios from 'axios';
import * as XLSX from 'xlsx-js-style';
import dayjs from 'dayjs';

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + '/api/';
const devApi = import.meta.env.VITE_DEV_API + '/api/';
const apiUrl = isDev ? devApi : prodApi;

export default function CencusMedicalExamTest() {
  const [open, setOpen] = useState(false);
  const exportCensusToExcel = (census: any) => {
    const ws = XLSX.utils.aoa_to_sheet([]);
    const days = Object.keys(census.Items[0].DailyCounts);

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

    XLSX.utils.sheet_add_aoa(
      ws,
      [
        [
          { v: 'Description', s: headerStyle },
          { v: 'Total', s: headerStyle },
          {
            v: `${dayjs(`${census.Year}-${census.Month}-01`).format('MMMM')} - Dates`,
            s: headerStyle,
          },
        ],
      ],
      { origin: 'A1' },
    );

    ws['!merges'] = [
      {
        s: { r: 0, c: 2 },
        e: { r: 0, c: 2 + days.length - 1 },
      },
    ];

    XLSX.utils.sheet_add_aoa(
      ws,
      [
        days.map((d) => ({
          v: d,
          s: headerStyle,
        })),
      ],
      { origin: 'C2' },
    );

    const dataRows = census.Items.map((item: any) => {
      return [
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
      ];
    });

    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: 'A3' });

    ws['!freeze'] = { ySplit: 2 };

    ws['!cols'] = [{ wch: 35 }, { wch: 10 }, ...days.map(() => ({ wch: 6 }))];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `${dayjs(`${census.Year}-${census.Month}-01`).format('MMMM')}-${census.Year}`,
    );

    const buffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
    });

    saveAs(
      new Blob([buffer], { type: 'application/octet-stream' }),
      `Census_${census.Month}_${census.Year}.xlsx`,
    );
  };

  const [loading, setLoading] = useState(false);
  const handlePrintCencus = async (month: number, year: number) => {
    try {
      setLoading(true);
      const res = await axios.get(`${apiUrl}census-medical-exam-test`, {
        headers: {
          'Content-Type': 'application/json',
        },
        params: {
          year: year,
          month: month,
        },
      });
      console.log(res.data.parameters);
      exportCensusToExcel(res.data.parameters);
    } catch (error) {
      console.error('Error fetching census data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover
      open={open}
      content={
        <div>
          <Form
            onFinish={(values: any) => {
              const date = values.month as dayjs.Dayjs;
              handlePrintCencus(date.month() + 1, date.year());
              setOpen(false);
            }}
            requiredMark={false}
          >
            <Form.Item
              name="month"
              className="!mb-2"
              rules={[
                {
                  required: true,
                  message: 'Please select Month and Year',
                },
              ]}
            >
              <DatePicker picker="month" format="MMMM/YYYY" />
            </Form.Item>
            <div className="flex gap-x-2 items-center justify-end">
              <Button onClick={() => setOpen(false)} size="small">
                Close
              </Button>
              <Button
                htmlType="submit"
                loading={loading}
                type="primary"
                size="small"
              >
                Print
              </Button>
            </div>
          </Form>
        </div>
      }
      trigger="click"
      arrow={false}
      placement="right"
    >
      <Button type="primary" loading={loading} onClick={() => setOpen(true)}>
        Print Medical Exams & Tests Census
      </Button>
    </Popover>
  );
}
