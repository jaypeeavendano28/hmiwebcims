import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, DatePicker, Divider, Form, Input, Radio, Switch } from 'antd';
import { PostData } from '../../helpers';
import useAppStore from '../../store';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Loading from '../../components/loading';
import PatientsPerCounter from '../../components/PatientsPerCounter';
export const Route = createLazyFileRoute(
  '/_authenticated/registeredpatients/$station',
)({
  component: () => <RegisteredPatients />,
});

type FilterType = {
  DateFrom: string | undefined;
  DateTo: string | undefined;

  isDone: boolean;
  Name: string;
  MemberNo: string;
};

const RegisteredPatients = () => {
  // const [IsSubmitting, setIsSubmitting] = useState(false);

  const [station] = Route.useParams().station;
  const [header, setHeader] = useState('');
  const [expandedRows, setExpandedRows] = useState(null);
  const store = useAppStore();
  const router = useRouter();
  const search = Route.useSearch() as { IsMobile?: boolean | string };
  const IsMobile = search.IsMobile === true || search.IsMobile === 'true';

  const queryClient = useQueryClient();

  const [filterData, setFilterData] = useState<FilterType>({
    DateFrom: dayjs().format('YYYYMMDD'),
    DateTo: dayjs().format('YYYYMMDD'),

    isDone: false,
    Name: '',
    MemberNo: '',
  });

  const { DateFrom, DateTo, isDone, Name, MemberNo } = filterData;

  const [form] = Form.useForm();
  const q = useQueryClient();

  // const dateFrom = form.getFieldValue('date')
  //   ? dayjs(form.getFieldValue('date')[0]).format('YYYYMMDD')
  //   : '';
  // const dateTo = form.getFieldValue('date')
  //   ? dayjs(form.getFieldValue('date')[1]).format('YYYYMMDD')
  //   : '';

  const patientPerCounter = useQuery({
    queryKey: ['patientPerCounter', filterData, IsMobile],
    queryFn: async () => {
      let res = await PostData('GetRecords', {
        sp: 'udp_GetPatientPerCounter',
        parameters: {
          BranchCode: store.branchCode,
          DateFrom: DateFrom ?? '',
          DateTo: DateTo ?? '',
          Station: station,
          UserId: store.userId,
          isDone: isDone,
          Name: Name,
          MemberNo: MemberNo,
          IsMobile: IsMobile,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 5,
  });

  const rowExpansionTemplate = (data: any) => {
    return (
      <PatientsPerCounter
        CounterCode={data.CounterCode}
        // DateFrom={
        //   form.getFieldValue('DateFrom')
        //     ? dayjs(form.getFieldValue('DateFrom')[0]).format('YYYYMMDD')
        //     : ''
        // }
        // DateTo={
        //   form.getFieldValue('DateTo')
        //     ? dayjs(form.getFieldValue('DateTo')[1]).format('YYYYMMDD')
        //     : ''
        // }
        DateFrom={DateFrom ?? ''}
        DateTo={DateTo ?? ''}
        Station={station}
        isDone={isDone}
        Name={Name}
        MemberNo={MemberNo}
        IsMobile={IsMobile}
      />
    );
  };

  // useEffect(() => {
  //   form.setFieldsValue({});
  // }, []);
  useEffect(() => {
    if (station === '1') {
      setHeader('Registered Patients');
    } else if (station === '2') {
      setHeader('Consultations');
    } else if (station === '0') {
      setHeader('Hemodialysis/Ambulatory Patients');
    }
    queryClient.invalidateQueries({ queryKey: ['patientPerCounter'] });
  }, [station]);
  return (
    <div className="cardBackGround">
      <Divider>{header}</Divider>
      <Form
        form={form}
        // initialValues={{
        //   isDone: 'not-done',
        //   date: [dayjs(new Date()), dayjs(new Date())],
        // }}
        layout="vertical"
        // onFinish={() => {
        //   q.invalidateQueries({ queryKey: ['patientPerCounter'] });
        //   setExpandedRows(null);
        // }}
      >
        <div className="flex gap-x-5 flex-wrap">
          <Form.Item label="Date">
            <DatePicker.RangePicker
              format="MM/DD/YYYY"
              value={[
                DateFrom ? dayjs(DateFrom) : undefined,
                DateTo ? dayjs(DateTo) : undefined,
              ]}
              onChange={(days) =>
                setFilterData((prev) => ({
                  ...prev,
                  DateFrom: days
                    ? dayjs(days[0]).format('YYYYMMDD')
                    : undefined,
                  DateTo: days ? dayjs(days[1]).format('YYYYMMDD') : undefined,
                }))
              }
            />
          </Form.Item>
          {/* <Form.Item name="DateTo" label="Date To">
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item> */}
          <Form.Item label="Patient Name">
            <Input
              allowClear
              value={Name}
              onChange={(e) =>
                setFilterData((prev) => ({
                  ...prev,
                  Name: e.target.value ?? '',
                }))
              }
            />
          </Form.Item>
          <Form.Item label="Member No">
            <Input
              allowClear
              value={MemberNo}
              onChange={(e) =>
                setFilterData((prev) => ({
                  ...prev,
                  MemberNo: e.target.value ?? '',
                }))
              }
            />
          </Form.Item>
          <Form.Item label="Queue Status">
            <Radio.Group
              disabled={IsMobile}
              value={isDone ? 'done' : 'not-done'}
              onChange={(e) =>
                setFilterData((prev) => ({
                  ...prev,
                  isDone: e.target.value === 'done' ? true : false,
                }))
              }
            >
              <Radio value="done"> Completed </Radio>
              <Radio value="not-done"> In Queue </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="Mobile">
            <Switch
              checked={IsMobile}
              checkedChildren="Yes"
              unCheckedChildren="No"
              onChange={(checked) => {
                router.navigate({
                  to: '.',
                  search: (prev) => ({
                    ...prev,
                    IsMobile: checked,
                  }),
                });
              }}
            />
          </Form.Item>
          <div className="flex flex-col justify-center">
            <Button
              type="primary"
              onClick={() => {
                q.invalidateQueries({ queryKey: ['patientPerCounter'] });
              }}
              loading={patientPerCounter.isLoading}
            >
              Refresh List
            </Button>
          </div>
        </div>
      </Form>
      <div className="mt-2">
        {patientPerCounter.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={patientPerCounter.data}
            dataKey="CounterCode"
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            filterDisplay="row"
            emptyMessage="No Records!"
            stripedRows
            size="normal"
            rowExpansionTemplate={rowExpansionTemplate}
            expandedRows={expandedRows as any}
            onRowToggle={(e) => setExpandedRows(e.data as any)}
            tableStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          >
            <Column
              expander={patientPerCounter.data.length > 0}
              style={{ width: '5rem' }}
            />
            <Column field="CounterName" header="Counter Name" filter></Column>
          </DataTable>
        )}
      </div>
    </div>
  );
};
