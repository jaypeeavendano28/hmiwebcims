import { createFileRoute } from '@tanstack/react-router';
import { Form, Input, notification, Transfer } from 'antd';
import { useEffect, useState } from 'react';
import { PostData } from '../../../helpers';
import { TUserDeparments, TUsers } from '../../../types';
import { TransferDirection } from 'antd/es/transfer';

export const Route = createFileRoute('/_authenticated/userdepartments/$Id')({
  component: () => <UserDepartment />,
});

const UserDepartment = () => {
  const [form] = Form.useForm();
  const [departments, setDepartments] = useState([]);
  const { Id } = Route.useParams();
  const [targetKeys, setTargetKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const handleInitialized = async () => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetDepartments',
      parameters: {},
    });

    console.log(res);

    if (res) {
      setDepartments(res.parameters.lst);
    }

    res = await PostData('GetRecords', {
      sp: 'udp_GetUserDepartments',
      parameters: { UserId: Id },
    });

    if (res) {
      let x = [] as any;
      res.parameters.lst.forEach((element: TUserDeparments) => {
        x.push(element.DepartmentId);
      });

      setTargetKeys(x);
    }
  };

  const handleGetUserDetails = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetUserDetailsById',
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      const x: TUsers = res.parameters.lst[0];
      form.setFieldsValue({
        Username: x.Username,
        Fullname: x.Fullname,
      });
    }
  };

  const filterOption = (inputValue: any, option: any) =>
    option.Description.toLowerCase().indexOf(inputValue.toLowerCase()) > -1;

  const onSelectChange = (sourceSelectedKeys: any, targetSelectedKeys: any) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };

  const onChange = async (
    _: string[],
    direction: TransferDirection,
    moveKeys: string[],
  ) => {
    console.log({ lst: moveKeys, Direction: direction, Id: Id });

    const res = await PostData('SaveUserDepartment', {
      lst: moveKeys,
      Direction: direction,
      Id: Id,
    });
    if (res) {
      if (res.status === 1) {
        handleInitialized();
        notification.success({
          message:
            direction === 'right'
              ? 'Successfully added!'
              : 'Successfully removed!',
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };

  useEffect(() => {
    handleGetUserDetails();
    handleInitialized();
  }, []);

  console.log({ departments, selectedKeys });

  return (
    <div className="cardBackGround p-2">
      <Form form={form} layout="vertical">
        <div className="p-2 grid md:grid-cols-6 gap-4">
          <Form.Item name="Username" label="Username">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="Fullname" label="Fullname">
            <Input readOnly />
          </Form.Item>
        </div>
      </Form>

      <div className="font-bold text-center text-md mb-2">User Departments</div>
      <Transfer
        showSearch
        filterOption={filterOption}
        rowKey={(record) => record.Id}
        dataSource={departments}
        titles={['List of Departments', 'Added Departments']}
        targetKeys={targetKeys}
        selectedKeys={selectedKeys}
        onChange={onChange}
        onSelectChange={onSelectChange}
        render={(item) => item.Description!}
        listStyle={{
          width: 500,
          height: 500,
        }}
      />
    </div>
  );
};
