import { createFileRoute, useRouter } from '@tanstack/react-router';
import { Button, Form, Input, Select, notification } from 'antd';
import { PostData } from '../helpers';
import useAppStore from '../store';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useQuery } from '@tanstack/react-query';
import { TBranches } from '../types';

export const Route = createFileRoute('/login')({
  component: () => <LogIn />,
});
const LogIn = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const store = useAppStore();
  const [form] = Form.useForm();
  const router = useRouter();

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
  const handleLogIn = async (v: any) => {
    setIsProcessing(true);
    const res = await PostData('Login', { ...v, BranchCode: v.BranchCode });
    if (res) {
      setIsProcessing(false);
      if (res.status === 1) {
        store.setTokenIdWebCims(res.parameters.tokenId);
        store.setUsername(v.Username);
        store.setUserId(res.parameters.userId);
        store.setBranchCode(v.BranchCode);
        // store.setFullname(res.parameters.fullName);
        Cookies.set('WebCimsTokenId', res.parameters.tokenId);
        router.navigate({
          to: '/dashboard',
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };
  useEffect(() => {
    store.setHideSideBar('Y');
  }, []);
  return (
    <div className="containerLogIn">
      <div className="cardBackGround w-screen max-w-sm mx-auto mt-32">
        <div className="text-center font-bold text-lg">Login</div>
        <Form form={form} layout="vertical" onFinish={handleLogIn}>
          <Form.Item
            label="Branch"
            name="BranchCode"
            rules={[
              {
                required: true,
                message: 'Please select a branch!',
              },
            ]}
          >
            <Select showSearch autoFocus>
              {branches.data &&
                branches.data.map((d: TBranches) => (
                  <Select.Option key={d.Code} value={d.Code}>
                    {d.Name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="Username"
            label="Username"
            rules={[
              {
                required: true,
                message: 'Username is required!',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Password"
            label="Password"
            rules={[
              {
                required: true,
                message: 'Password is required!',
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={isProcessing}>
              Login
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
