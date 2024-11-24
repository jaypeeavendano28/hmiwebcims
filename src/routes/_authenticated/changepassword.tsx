import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button, Form, Input, notification } from "antd";
import { useEffect, useState } from "react";
import useAppStore from "../../store";
import { PostData } from "../../helpers";
import Cookies from "js-cookie";
import { useAuth } from "../../hooks/userAuth";
export const Route = createFileRoute("/_authenticated/changepassword")({
  component: () => <ChangePassword />,
});

const ChangePassword = () => {
  const router = useRouter();
  const auth = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [form] = Form.useForm();
  const store = useAppStore();
  const handleSubmitForm = async (v: any) => {
    setIsProcessing(true);
    const res = await PostData("ChangePassword", {
      ...v,
      Username: store.username,
      Id: 0,
    });

    if (res) {
      setIsProcessing(false);
      if (res.status === 1) {
        notification.success({
          message: "Password successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        Cookies.remove("WebCimsTokenId");
        store.setTokenIdWebCims("");
        store.setUsername("");
        auth.signOut();
        router.navigate({
          to: "/login",
        });
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  useEffect(() => {
    store.setHideSideBar("N");
  }, []);
  return (
    <div className="cardBackGround p-2 max-w-md mx-auto">
      <div className="text-center font-bold text-md">Change Password</div>
      <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
        <Form.Item
          name="OldPassword"
          label="Old Password"
          rules={[
            {
              required: true,
              message: "Old password is require!",
            },
          ]}
        >
          <Input.Password autoFocus />
        </Form.Item>
        <Form.Item
          name="Password"
          label="New Password"
          rules={[
            {
              required: true,
              message: "New password is require!",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="ConfirmPassword"
          label="Confirm New Password"
          rules={[
            {
              required: true,
              message: "Please confirm your password!",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue("Password") === value) {
                  return Promise.resolve();
                }

                return Promise.reject(
                  "The two passwords that you entered do not match!"
                );
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
        <div className="flex justify-end">
          <Button loading={isProcessing} type="primary" htmlType="submit">
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
};
