import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  notification,
} from "antd";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";

import { ScrollPanel } from "primereact/scrollpanel";
import { Tamount } from "../types";

type Props = {
  handleSelect?: (data: Tamount) => void;
};

export default function SearchCaseRates({ handleSelect }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [form] = Form.useForm();
  const [amounts, setAmounts] = useState<Tamount[] | undefined>([]);
  const handleSubmit = async (v: any) => {
    try {
      setIsProcessing(true);
      if (isNullOrUndefinedOrBlank(v.icdcode)) {
        v.icdcode = "";
      }
      if (isNullOrUndefinedOrBlank(v.rvscode)) {
        v.rvscode = "";
      }
      if (isNullOrUndefinedOrBlank(v.description)) {
        v.description = "";
      }
      const res = await PostData("searchCaseRates", {
        ...v,
        targetdate: dayjs().format("MM-DD-YYYY"),
      });
      if (res) {
        setIsProcessing(false);

        if (res) {
          const Amounts: Tamount[] = [];
          res.caserates.forEach((e: any) => {
            e.amount.forEach((f: Tamount) => {
              const am: Tamount = {};
              am.pitemCode = e.pitemCode;
              am.pcaseRateCode = e.pcaseRateCode;
              am.pcaseRateDescription = e.pcaseRateDescription;
              am.peffectivityDate = e.peffectivityDate;
              am.peffectivityEndDate = e.peffectivityEndDate;
              am.pitemDescription = e.pitemDescription;
              am.pprimaryProfFee = f.pprimaryProfFee;
              am.pprimaryHCIFee = f.pprimaryHCIFee;
              am.pcheckFacilityMAT = f.pcheckFacilityMAT;
              am.pprimaryCaseRate = f.pprimaryCaseRate;
              am.psecondaryHCIFee = f.psecondaryHCIFee;
              am.psecondaryProfFee = f.psecondaryProfFee;
              am.psecondaryCaseRate = f.psecondaryCaseRate;
              am.pcheckFacilityH1 = f.pcheckFacilityH1;
              am.pcheckFacilityH2 = f.pcheckFacilityH2;
              am.pcheckFacilityFSDC = f.pcheckFacilityFSDC;
              am.pcheckFacilityH3 = f.pcheckFacilityH3;
              am.pcheckFacilityASC = f.pcheckFacilityASC;
              am.pcheckFacilityPCF = f.pcheckFacilityPCF;
              am.pcheckFacilityTSEKAP = f.pcheckFacilityTSEKAP;
              am.pcheckFacilityABTC = f.pcheckFacilityABTC;
              am.pcheckFacilityTBDOTSC = f.pcheckFacilityTBDOTSC;
              am.pcheckFacilityOPMC = f.pcheckFacilityOPMC;
              am.pcheckFacilityRHU = f.pcheckFacilityRHU;
              am.pcheckFacilityDATRC = f.pcheckFacilityDATRC;
              am.pcheckFacilityHIVTH = f.pcheckFacilityHIVTH;
              am.pcheckFacilityFPC = f.pcheckFacilityFPC;
              am.pcheckFacilityCIU = f.pcheckFacilityCIU;
              am.pcheckFacilityDSP = f.pcheckFacilityDSP;
              am.pcheckFacilityPCB = f.pcheckFacilityPCB;
              // setAmounts([...(amounts || []), am]);
              Amounts.push(am);
            });
          });
          setAmounts(Amounts);
        }
      }
    } catch (error: AxiosError | any) {
      setIsProcessing(false);
      if (error.response) {
        notification.error({
          message: error.response.data,
          placement: "topRight",
          duration: 3,
        });
      } else {
        notification.error({
          message: error.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  // const rowExpansionTemplate = (data: Tamount) => {
  //   console.log(data.pitemCode);
  //   return (
  //     <>
  //       <div className="grid grid-cols-8">
  //         <div>
  //           <p>Primary Case Rate</p>
  //           <p className="font-bold">{data["pitemCode"]}</p>
  //         </div>
  //       </div>
  //     </>
  //   );
  // };
  useEffect(() => {
    form.setFieldValue("targetdate", dayjs());
  }, []);
  return (
    <>
      <Divider>Search Case Rates</Divider>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid grid-cols-6 gap-4">
          <Form.Item
            name="icdcode"
            label="ICD 10 Code"
            normalize={(v) => v.toUpperCase()}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="rvscode"
            label="RVS Code"
            normalize={(v) => v.toUpperCase()}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            normalize={(v) => v.toUpperCase()}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="targetdate"
            label="Target Date"
            rules={[
              {
                required: true,
                message: "Target Date is required!",
              },
            ]}
          >
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
          <div className="flex items-center">
            <Button type="primary" htmlType="submit" loading={isProcessing}>
              Submit
            </Button>
          </div>
        </div>
      </Form>
      <ScrollPanel style={{ width: "100%", height: "500px" }}>
        {amounts?.map((e: Tamount) => (
          <div>
            <Card
              style={{
                background: "#F3F2EC",
              }}
              hoverable
              className="mt-2"
              title={
                <div className="flex">
                  <div>Item Code:{e.pitemCode}</div>
                  <div className="ml-6">Case Rate Code:{e.pcaseRateCode}</div>
                  <Button
                    className="ml-2"
                    type="primary"
                    onClick={() => handleSelect?.(e)}
                  >
                    Select
                  </Button>
                </div>
              }
              onDoubleClick={() => handleSelect?.(e)}
            >
              <p className="font-semibold">{e.pitemDescription}</p>
              <div className="grid grid-cols-6">
                <div>
                  <p>Effectivity Date</p>
                  <p className="font-semibold">{e.peffectivityDate}</p>
                </div>
                <div>
                  <p>Effectivity End-Date</p>
                  <p className="font-semibold">{e.peffectivityEndDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-8">
                <div>
                  <p>Primary HCIFee</p>
                  <div className="font-bold">{e.pprimaryHCIFee}</div>
                </div>
                <div>
                  <p>Primary Prof. Fee</p>
                  <div className="font-bold">{e.pprimaryProfFee}</div>
                </div>

                <div>
                  <p>Secondary HCIFee</p>
                  <div className="font-bold">{e.psecondaryHCIFee}</div>
                </div>
                <div>
                  <p>Secondary Prof. Fee</p>
                  <div className="font-bold">{e.psecondaryProfFee}</div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-12">
                <div>
                  <p>Facility H1</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityH1 === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>Facility H2</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityH2 === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>Facility H3</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityH3 === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>PCF</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityPCF === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>RHU</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityRHU === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>ABTC</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityABTC === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>ASC</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityASC === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>MAT</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityMAT === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>TB-DOTS</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityTBDOTSC === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>CIU</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityCIU === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>TSEKAP</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityTSEKAP === "T" ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p>DATRC</p>
                  <p className="font-semibold">
                    {e.pcheckFacilityDATRC === "T" ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </Card>
            <div className="mb-2"></div>
          </div>
        ))}
      </ScrollPanel>

      {/* <div className="mt-2">
        <DataTable
          value={caserates}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          emptyMessage="No Records!"
          stripedRows
          size="small"
          filterDisplay="row"
          rowExpansionTemplate={rowExpansionTemplate}
          expandedRows={expandedRows as any}
          onRowToggle={(e) => setExpandedRows(e.data as Tamount)}
        >
          <Column
            expander={caserates && caserates!.length > 0}
            style={{ width: "2rem" }}
          />

          <Column field="pcaseRateCode" header="Case Rate Code"></Column>
          <Column field="pitemCode" header="Item Code"></Column>
          <Column field="pitemDescription" header="Item Description"></Column>
          <Column field="peffectivityDate" header="Effective From"></Column>
          <Column field="peffectivityEndDate" header="Effective To"></Column>
        </DataTable>
      </div> */}
    </>
  );
}
