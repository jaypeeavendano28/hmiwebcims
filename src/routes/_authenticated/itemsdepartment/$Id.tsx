import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { App, Button, Divider, Form, Input, Select } from 'antd';
import { PostData } from '../../../helpers';
import { TDepartments, TItemDepartments, TItems } from '../../../types';
import { useEffect, useState } from 'react';

type FieldType = {
  Description: string;
  GenericName: string;
  UnitOfMeasureSmall: string;
  UnitOfMeasureBig: string;
  Dosage: string;
  departments: number[];
};

export const Route = createFileRoute('/_authenticated/itemsdepartment/$Id')({
  component: () => <ItemsDepartment />,
});

const ItemsDepartment = () => {
  const [form] = Form.useForm();
  const { Id } = Route.useParams();
  const router = useRouter();
  const { notification } = App.useApp();
  const [isSaving, setIsSaving] = useState(false);

  const handleGetItemDepartments = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetItemDepartments',
      parameters: {
        ItemId: Id,
      },
    });
    if (res) {
      const x: TItemDepartments[] = res.parameters.lst;

      console.log(x);

      //let QCounters: string[] = split(x.QCounter, ",");

      form.setFieldsValue({
        departments: x.map((d) => d.Id),
      });
    }
  };

  const handleGetItemDetails = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetItemDetailsById',
      parameters: {
        Id: Id,
      },
    });

    if (res) {
      const x: TItems = res.parameters.lst[0];

      //let QCounters: string[] = split(x.QCounter, ",");

      form.setFieldsValue({
        Description: x.Description,
        GenericName: x.GenericName,
        UnitOfMeasureSmall: x.UnitOfMeasureSmall,
        UnitOfMeasureBig: x.UnitOfMeasureBig,
        Dosage: x.Dosage,
      });
    }
  };

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDepartments',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleSubmit = async (v: FieldType) => {
    try {
      setIsSaving(true);
      const res = await PostData(
        'SaveItemDepartments',
        v.departments.map((i) => ({
          ItemId: Id,
          DepartmentId: i,
        })),
      );
      if (res.status === 1) {
        notification.success({
          message: 'Item successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
        //    console.log(res);
        // router.navigate({
        //   to: "/items",
        // });
        //   <Link
        //   to="/itemprofile/$Id"
        //   params={{
        //     Id: data !== undefined ? data.Id : "",
        //   }}
        // >
        if (Id === '0') {
          router.navigate({
            to: '/itemsdepartment/$Id',
            params: {
              Id: Id,
            },
          });
        }
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (err) {
      console.log(err);
      notification.error({
        message: 'Something went wrong please try again later',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (Id !== '0') {
      handleGetItemDetails();
      handleGetItemDepartments();
    }
  }, []);
  return (
    <div className="cardBackGround  mx-auto">
      <Divider>Item Departments</Divider>
      <Form
        form={form}
        layout="vertical"
        className="lg:grid lg:grid-cols-2 gap-x-5"
        onFinish={handleSubmit}
      >
        <Form.Item name="Description" label="Description/Brand Name">
          <Input readOnly />
        </Form.Item>
        <Form.Item name="GenericName" label="Generic Name">
          <Input readOnly />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-5">
          <Form.Item
            name="UnitOfMeasureBig"
            label="Unit Of Measure Big"
            normalize={(v) => v.toUpperCase()}
          >
            <Input readOnly />
          </Form.Item>
          <Form.Item
            name="UnitOfMeasureSmall"
            label="Unit Of Measure Small"
            normalize={(v) => v.toUpperCase()}
          >
            <Input readOnly />
          </Form.Item>
        </div>
        <Form.Item name="Dosage" label="Dosage">
          <Input readOnly />
        </Form.Item>
        <Form.Item
          label="Department(s)"
          name="departments"
          className="col-span-2"
          rules={[
            {
              required: true,
              message: 'Please select at least 1 department!',
            },
          ]}
        >
          <Select
            mode="multiple"
            allowClear
            optionFilterProp="label"
            options={departments.data?.map((d: TDepartments) => ({
              value: d.Id,
              label: d.Description,
            }))}
          />
        </Form.Item>

        <div className="col-span-2 grid justify-end ">
          <Button type="primary" htmlType="submit" loading={isSaving}>
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
};
