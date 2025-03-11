import { useQuery } from "@tanstack/react-query";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";
import Loading from "./loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  TAppointments,
  TCharges,
  TDiscountTypes,
  THmoDeduction,
  TPhicDeductions,
  TProfessionalFee,
} from "../types";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  notification,
  Popconfirm,
  Space,
  Tooltip,
} from "antd";
import { useEffect, useState } from "react";
import Discount from "./Discount";
import PHICDeduction from "./PHICDeduction";
import HmoDeduction from "./HmoDeduction";
import AddCharge from "./AddCharge";
import Pf from "./Pf";
import { FaUserEdit } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";
import { useAuth } from "../hooks/userAuth";

type ChargesProps = {
  AppointmentId: number;
};

export default function Charges({ AppointmentId }: ChargesProps) {
  const auth = useAuth();
  const [form] = Form.useForm();
  const [showFinalizedBilling, setShowFinalizedBilling] = useState(false);
  const [selectedPf, setSeletectedPf] = useState<
    TProfessionalFee | undefined
  >();

  const [showPf, setShowPf] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TCharges | undefined>();
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showHmo, setShowHmo] = useState(false);
  const [openDiscount, setOpenDiscount] = useState(false);
  const [showPhicDeduction, setShowPhicDeduction] = useState(false);
  const appDetails = useQuery<TAppointments>({
    queryKey: ["appDetails"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetAppointmentDetails",
        parameters: {
          Id: AppointmentId,
        },
      });
      if (res) {
        return res.parameters.lst[0];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const charges = useQuery({
    queryKey: ["charges"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetChargesByAppointmentId",
        parameters: {
          AppointmentId,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const pf = useQuery({
    queryKey: ["pf"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPf",
        parameters: {
          Id: AppointmentId,
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={3}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            charges.data
              .reduce((sum: number, b: TCharges) => b.Gross! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            charges.data
              .reduce((sum: number, b: TCharges) => b.Vat! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            charges.data
              .reduce((sum: number, b: TCharges) => b.Discount! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            charges.data
              .reduce((sum: number, b: TCharges) => b.PhicAmount! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            charges.data
              .reduce((sum: number, b: TCharges) => b.HmoAmount! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            charges.data
              .reduce((sum: number, b: TCharges) => b.Net! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
      </Row>
    </ColumnGroup>
  );
  const footerGroup2 = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={2}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            pf.isSuccess &&
            pf.data
              .reduce((sum: number, b: TProfessionalFee) => b.Amount! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            pf.isSuccess &&
            pf.data
              .reduce((sum: number, b: TProfessionalFee) => b.Vat! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            pf.isSuccess &&
            pf.data
              .reduce(
                (sum: number, b: TProfessionalFee) => b.Discount! + sum,
                0
              )
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            pf.isSuccess &&
            pf.data
              .reduce((sum: number, b: TProfessionalFee) => b.Phic! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            pf.isSuccess &&
            pf.data
              .reduce((sum: number, b: TProfessionalFee) => b.Hmo! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
        <Column
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
            fontSize: "16px",
          }}
          footer={() =>
            pf.isSuccess &&
            pf.data
              .reduce((sum: number, b: TProfessionalFee) => b.Net! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
      </Row>
    </ColumnGroup>
  );
  const handleFinalizeBilling = async (v: any) => {
    const FinalizedMode = isNullOrUndefinedOrBlank(appDetails.data?.FinalizedBy)
      ? "F"
      : "U";
    try {
      const res = await PostData("FinalizedBilling", {
        Username: v.Username,
        Password: v.Password,
        AppointmentId: AppointmentId,
        FinalizedMode,
      });
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Billing successfully finalized!",
            placement: "topRight",
            duration: 3,
          });
          location.reload();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSaveDiscount = async (v: TDiscountTypes) => {
    try {
      const res = await PostData("ProcessDiscount", {
        fk_Appointments_Id: AppointmentId,
        fk_DiscountTypes_Id: v.fk_DiscountTypes_Id,
      });
      if (res) {
        setOpenDiscount(false);
        location.reload();
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSavePhicDeductions = async (v: TPhicDeductions) => {
    try {
      setShowPhicDeduction(false);
      const res = await PostData("ProcessPhicDeduction", {
        ...v,
        fk_Appointments_Id: AppointmentId,
      });
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Successfully saved!",
            duration: 3,
            placement: "topRight",
          });
          location.reload();
        } else {
          notification.error({
            message: res.message,
            duration: 3,
            placement: "topRight",
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSaveHmoDeduction = async (v: THmoDeduction) => {
    setShowHmo(false);

    try {
      const res = await PostData("ProcessHmoDeduction", {
        ...v,
        fk_Appointments_Id: AppointmentId,
        fk_HmoCompany_Id: v.fk_HmoCompany_Id,
      });
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });
          location.reload();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleResetAllDeductions = async () => {
    try {
      const res = await PostData("ResetAllDeductions", {
        fk_Appointments_Id: AppointmentId,
      });
      if (res) {
        if (res.status === 1) {
          notification.error({
            message: "Deductions successfully reset!",
            placement: "topRight",
            duration: 3,
          });
          location.reload();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleDeletePf = async (v: TProfessionalFee) => {
    try {
      const res = await PostData("DeletePf", {
        ...v,
      });
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "Successfully deleted!",
            placement: "topRight",
            duration: 3,
          });
          location.reload();
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const actionBodyTemplatePf = (data: TProfessionalFee) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <FaUserEdit
            onClick={() => {
              setSeletectedPf(data);
              setShowPf(true);
            }}
            size={16}
            className="cursor-pointer"
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Popconfirm
            title="Delete this record?"
            onConfirm={() => handleDeletePf(data)}
          >
            <FaTrash size={16} color="red" className="cursor-pointer" />
          </Popconfirm>
        </Tooltip>
      </Space>
    );
  };

  return (
    <div className="mt-2">
      <div className="grid lg:grid-cols-12 sm:grid-cols-1 ">
        <div className="sm:col-span-1 lg:col-span-10">
          <Space>
            <Button
              type="primary"
              onClick={() => {
                setSelectedRecord(undefined);
                setShowAddCharge(true);
              }}
              disabled={!isNullOrUndefinedOrBlank(appDetails.data?.FinalizedBy)}
            >
              Add Charges
            </Button>
            <Button
              type="primary"
              onClick={() => setOpenDiscount(true)}
              disabled={!isNullOrUndefinedOrBlank(appDetails.data?.FinalizedBy)}
            >
              Discount
            </Button>
            <Button
              type="primary"
              onClick={() => setShowPhicDeduction(true)}
              disabled={!isNullOrUndefinedOrBlank(appDetails.data?.FinalizedBy)}
            >
              PHIC Deduction
            </Button>
            <Button
              type="primary"
              onClick={() => setShowHmo(true)}
              disabled={
                isNullOrUndefinedOrBlank(appDetails.data?.fk_HmoCompany_Id) ||
                !isNullOrUndefinedOrBlank(appDetails.data?.FinalizedBy)
              }
            >
              HMO/Company Deduction
            </Button>
            <Button type="primary" onClick={() => setOpenDiscount(true)}>
              Print SOA
            </Button>
            <Button
              type="primary"
              onClick={() => setShowFinalizedBilling(true)}
            >
              {isNullOrUndefinedOrBlank(appDetails.data?.FinalizedBy)
                ? `Finalized Billing`
                : `Un-Finalized Bililng`}
            </Button>
          </Space>
        </div>
        <div className="sm:col-span-1 lg:col-span-2">
          <Space>
            <Popconfirm
              title="Reset all deductions?"
              okText="Yes"
              cancelText="No"
              onConfirm={handleResetAllDeductions}
            >
              <Button
                type="primary"
                danger
                disabled={
                  !isNullOrUndefinedOrBlank(appDetails.data?.FinalizedBy)
                }
              >
                Reset All Deductions
              </Button>
            </Popconfirm>
          </Space>
        </div>
      </div>

      {charges.isLoading ? (
        <Loading size={64} />
      ) : (
        <DataTable
          value={charges.data}
          // paginator
          // rows={10}
          // rowsPerPageOptions={[10, 25, 50]}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          filterDisplay="row"
          // rowExpansionTemplate={rowExpansionTemplate}
          // expandedRows={expandedRows as any}
          // onRowToggle={(e) => setExpandedRows(e.data as any)}
          footerColumnGroup={footerGroup}
        >
          {/* <Column
            expander={charges.data!.length > 0}
            style={{ width: "2rem" }}
          /> */}
          {/* <Column
                  field="action"
                  header="Action"
                  body={(data: any) => actionBodyTemplate(data)}
                ></Column> */}
          <Column field="Description" header="Description"></Column>
          <Column
            align={"right"}
            field="Qty"
            header="Qty"
            body={(data: TCharges) =>
              data.Qty?.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            }
          ></Column>
          <Column
            align={"right"}
            field="Price"
            header="Price"
            body={(data: TCharges) =>
              data.Price?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
          <Column
            align={"right"}
            field="Gross"
            header="Gross"
            body={(data: TCharges) =>
              data.Gross?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
          <Column
            align={"right"}
            field="Vat"
            header="Vat"
            body={(data: TCharges) =>
              data.Vat?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
          <Column
            align={"right"}
            field="Discount"
            header="Discount"
            body={(data: TCharges) =>
              data.Discount?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
          <Column
            align={"right"}
            field="Phic"
            header="PHIC"
            body={(data: TCharges) =>
              data.PhicAmount?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
          <Column
            align={"right"}
            field="HmoAmount"
            header="Hmo"
            body={(data: TCharges) =>
              data.HmoAmount?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
          <Column
            align={"right"}
            field="Net"
            header="Balance"
            body={(data: TCharges) =>
              data.Net?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
          ></Column>
        </DataTable>
      )}
      <Divider>Professional Fees</Divider>
      <Space className="mt-2">
        <Button
          type="primary"
          onClick={() => {
            setShowPf(true);
          }}
        >
          New
        </Button>
      </Space>
      <div className="mt-2">
        {charges.isLoading ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={pf.data}
            // paginator
            // rows={10}
            // rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filterDisplay="row"
            // rowExpansionTemplate={rowExpansionTemplate}
            // expandedRows={expandedRows as any}
            // onRowToggle={(e) => setExpandedRows(e.data as any)}
            footerColumnGroup={footerGroup2}
          >
            <Column
              field="action"
              header="Action"
              body={(data: TProfessionalFee) => actionBodyTemplatePf(data)}
            ></Column>
            <Column field="Doctor" header="Name"></Column>
            <Column
              align={"right"}
              field="Amount"
              header="Amount"
              body={(data: TProfessionalFee) =>
                data.Amount?.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              }
            ></Column>
            <Column
              align={"right"}
              field="Vat"
              header="Vat"
              body={(data: TProfessionalFee) =>
                data.Vat?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
            ></Column>
            <Column
              align={"right"}
              field="Discount"
              header="Discount"
              body={(data: TProfessionalFee) =>
                data.Discount?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
            ></Column>

            <Column
              align={"right"}
              field="Phic"
              header="PHIC"
              body={(data: TProfessionalFee) =>
                data.Phic?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
            ></Column>
            <Column
              align={"right"}
              field="Hmo"
              header="HMO/Company"
              body={(data: TProfessionalFee) =>
                data.Hmo?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
            ></Column>
            <Column
              align={"right"}
              field="Net"
              header="Balance"
              body={(data: TCharges) =>
                data.Net?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              }
            ></Column>
          </DataTable>
        )}
      </div>
      <div className="flex justify-end font-bold text-xl text-red-500">
        Grand Total:
        {(
          (charges?.data?.reduce(
            (sum: number, b: TCharges) => b.Net! + sum,
            0
          ) ?? 0) +
          (pf?.data?.reduce(
            (sum: number, b: TProfessionalFee) => b.Net! + sum,
            0
          ) ?? 0)
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <Modal
        open={openDiscount}
        onCancel={() => setOpenDiscount(false)}
        footer={null}
      >
        <Discount
          handleSaveDiscount={handleSaveDiscount}
          DiscountType={Number(appDetails.data?.fk_DiscountTypes_Id)}
        />
      </Modal>
      <Modal
        destroyOnClose
        open={showPhicDeduction}
        onCancel={() => setShowPhicDeduction(false)}
        footer={null}
        width={screen.availWidth - 400}
      >
        <PHICDeduction
          handleSavePhicDeductions={handleSavePhicDeductions}
          AppointmentId={AppointmentId}
        />
      </Modal>
      <Modal
        open={showHmo}
        onCancel={() => setShowHmo(false)}
        footer={null}
        width={screen.availWidth - 400}
        destroyOnClose
      >
        <HmoDeduction
          HmoCompany={Number(appDetails.data?.fk_HmoCompany_Id)}
          handleSaveHmoDeduction={handleSaveHmoDeduction}
          Balance={
            charges.isSuccess &&
            charges.data
              .reduce((sum: number, b: TCharges) => b.Net! + sum, 0)
              .toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
          }
        />
      </Modal>
      <Modal
        open={showAddCharge}
        onCancel={() => {
          setShowAddCharge(false);
          window.location.reload();
        }}
        title="Add Charges"
        footer={false}
        width={screen.width - 80}
        destroyOnClose
      >
        <AddCharge
          Id={AppointmentId.toString()}
          ChargeDetails={selectedRecord}
          Gender={appDetails?.data?.Sex as string}
        />
      </Modal>
      <Modal
        open={showPf}
        onCancel={() => {
          setShowPf(false);
          window.location.reload();
        }}
        title="Professional Fees"
        footer={false}
        destroyOnClose
        width={screen.width - 300}
      >
        <Pf AppointmentId={AppointmentId} selectedRecord={selectedPf} />
      </Modal>
      <Modal
        open={showFinalizedBilling}
        footer={null}
        onCancel={() => setShowFinalizedBilling(false)}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinalizeBilling}
          className="max-w-md"
        >
          <Form.Item name="Username" label="Username">
            <Input autoFocus />
          </Form.Item>{" "}
          <Form.Item name="Password" label="Password">
            <Input.Password />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
