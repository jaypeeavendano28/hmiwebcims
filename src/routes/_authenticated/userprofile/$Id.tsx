import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button, Form, Input, notification } from "antd";
import { useForm } from "antd/es/form/Form";
import { PostData, WithAccess } from "../../../helpers";
import { useEffect, useState } from "react";
import useAppStore from "../../../store";

export const Route = createFileRoute("/_authenticated/userprofile/$Id")({
  component: UserProfile,
});

function UserProfile() {
  const router = useRouter();
  const store = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { Id } = Route.useParams();
  const [form] = useForm();

  async function handleSubmitForm(v: any) {
    setIsProcessing(true);
    try {
      const res = await PostData("SaveUser", { ...v, Id: Id });
      if (res) {
        setIsProcessing(false);
        if (res.status === 1) {
          notification.success({
            message: "User profile successfully saved!",
            placement: "topRight",
            duration: 3,
          });
          router.navigate({
            to: "/users",
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

  const handleWithAccess = async (ModuleId: number, Description: string) => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: ModuleId,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-" + Description,
          placement: "topRight",
          duration: 3,
        });
        router.navigate({
          to: "/users",
        });
      }
    }
  };

  useEffect(() => {
    store.setHideSideBar("N");
    handleWithAccess(2, "Users-New");
  }, []);

  return (
    <>
      <div className="max-w-md mx-auto cardBackGround">
        <div className="font-bold text-md text-center">User Profile</div>
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
            <Input autoFocus />
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
            <Input />
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
          <Form.Item
            name="Password"
            label="Password"
            rules={[
              {
                required: true,
                message: "Password is required!",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="ConfirmPassword"
            label="Confirm Password"
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
            <Button type="primary" htmlType="submit" loading={isProcessing}>
              Submit
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}
