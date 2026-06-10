import { createFileRoute } from '@tanstack/react-router';
import useAppStore from '../../store';
import { useEffect, useState } from 'react';
import { Card, DatePicker, Form, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiUrl, PostData } from '../../helpers';
import Cookies from 'js-cookie';
import { Chart } from 'primereact/chart';
import dayjs from 'dayjs';
import { TBranches } from '../../types';

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: () => <Dashboard />,
});

const Dashboard = () => {
  const store = useAppStore();
  useEffect(() => {
    store.setHideSideBar('N');
  }, []);

  const [filter, setFilter] = useState({
    year: dayjs().year(),
    branchCode: '01',
  });

  const patientChart = useQuery({
    queryKey: ['patient_chart', filter],
    queryFn: async () => {
      const res = await axios
        .get(
          `${apiUrl}patient-chart/${filter.year.toString()}/${filter.branchCode}`,
          {
            headers: {
              Authorization: ('Bearer ' +
                Cookies.get('WebCimsTokenId')) as string,
            },
          },
        )
        .then((res) => res.data);
      return res.parameters;
    },
    staleTime: 0,
  });

  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await PostData('GetRecords2', {
        sp: 'udp_GetBranches',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  return (
    <Card>
      <div className="flex gap-x-2">
        <Form.Item label="Branch" className="mb-0!">
          <Select
            showSearch
            autoFocus
            value={filter.branchCode}
            onChange={(branchCode) => {
              setFilter((prev) => ({
                ...prev,
                branchCode,
              }));
            }}
          >
            {branches.data &&
              branches.data.map((d: TBranches) => (
                <Select.Option key={d.Code} value={d.Code}>
                  {d.Name}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>
        <Form.Item label="Year" className="mb-0!">
          <DatePicker
            picker="year"
            value={dayjs().year(filter.year)}
            onChange={(date) => {
              setFilter((prev) => ({
                ...prev,
                year: date?.year() ?? dayjs().year(),
              }));
            }}
          />
        </Form.Item>
      </div>

      <Chart
        type="bar"
        data={patientChart.data}
        options={{ maintainAspectRatio: false }}
        style={{ height: '70vh' }}
      />
    </Card>
  );
};
