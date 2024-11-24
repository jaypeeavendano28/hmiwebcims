import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../store";
import { PostData } from "../../helpers";
import { Button, Form, Input, notification } from "antd";
import { useEffect, useState } from "react";
import { TUsers } from "../../types";

export const Route = createFileRoute("/_authenticated/updateuserprofile")({
  component: UpdateUserProfile,
});

function UpdateUserProfile() {
  const store = useAppStore();
  const [form] = Form.useForm();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleGetUserDetails() {
    try {
      const res = await PostData("GetRecords", {
        sp: "udp_GetUserDetails",
        parameters: {
          Username: store.username,
        },
      });
      if (res) {
        if (res.status === 1) {
          const x: TUsers = res.parameters.lst[0];
          console.log(x);
          form.setFieldsValue({
            Username: x.Username,
            Fullname: x.Fullname,
            EmailAddress: x.EmailAddress,
          });
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {}
  }
  async function handleSubmitForm(v: any) {
    setIsProcessing(true);
    try {
      const res = await PostData("SaveUser", { ...v, Id: store.userId });
      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: "User profile successfully updated!",
            placement: "topRight",
            duration: 3,
          });
          router.navigate({
            to: "/",
          });
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      setIsProcessing(false);
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  }
  useEffect(() => {
    store.setHideSideBar("N");
    handleGetUserDetails();
  }, []);
  return (
    <>
      <div className="max-w-md mx-auto cardBackGround">
        <div className="font-bold text-md text-center">Update User Profile</div>
        <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            name="Username"
            label="Username"
            rules={[
              {
                required: true,
                message: "Username is required!",
              },
            ]}
          >
            <Input readOnly />
          </Form.Item>
          <Form.Item
            name="Fullname"
            label="Fullname"
            rules={[
              {
                required: true,
                message: "Fullname is required!",
              },
            ]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            name="EmailAddress"
            label="Email Address"
            rules={[
              {
                required: true,
                message: "Email Address is required!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={isProcessing}>
              Submit
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}
