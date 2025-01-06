import { AutoComplete, Checkbox, CheckboxProps, Tooltip } from "antd";
import { FC, useEffect, useState } from "react";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";

type Props = {
  data: any;
  handleSaveResult: (v: any) => void;
  ResultId: number;
};

const LabResult: FC<Props> = ({ data, handleSaveResult, ResultId }) => {
  const [ShowInPrintOut, setShowInPrintOut] = useState(false);
  const [result, setResult] = useState(data.ResultSi);
  const [possibleValues, setPossibleValues] = useState([]);
  const handleSave = async () => {
    let showInPrintOut: boolean = ShowInPrintOut;
    if (!isNullOrUndefinedOrBlank(result)) {
      showInPrintOut = true;
    } else {
      showInPrintOut = false;
    }
    setShowInPrintOut(showInPrintOut);
    handleSaveResult({
      ...data,
      ResultSi: result,
      ShowInPrintOut: showInPrintOut,
    });
  };
  const handleGetPossibleValues = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPossibleValues",
      parameters: {
        TestId: data.TestId,
      },
    });
    if (res) {
      setPossibleValues(res.parameters.lst);
    }
  };
  const handleChange: CheckboxProps["onChange"] = (e) => {
    setShowInPrintOut(e.target.checked);

    handleSaveResult({
      ...data,
      ResultSi: result,
      ShowInPrintOut: e.target.checked,
    });
    // handleSave()
  };
  useEffect(() => {
    handleGetPossibleValues();
    if (ResultId > 0) {
      if (!isNullOrUndefinedOrBlank(data.ResultSi)) {
        setShowInPrintOut(true);
      } else {
        if (data.ShowInPrintOut === true) {
          setShowInPrintOut(true);
        } else {
          setShowInPrintOut(false);
        }
      }
    } else {
      setShowInPrintOut(data.ShowInPrintOut);
    }
  }, [data]);
  return (
    <>
      <div className="grid md:grid-cols-4 gap-4 mb-2">
        <div>
          <p className="">{data.Test}</p>
        </div>

        <div className="flex">
          <AutoComplete
            filterOption={(inputValue, option) =>
              option!
                .value!.toString()
                .toUpperCase()
                .indexOf(inputValue.toUpperCase()) !== -1
            }
            style={{ width: "100%" }}
            value={result}
            onChange={(v) => {
              setResult(v);
            }}
            onBlur={handleSave}
            disabled={data.IsWithResult === "N"}
          >
            {possibleValues!.map((v: any) => (
              <AutoComplete.Option key={v.Id} value={v.Value} title={v.Value}>
                {v.Value}
              </AutoComplete.Option>
            ))}
          </AutoComplete>
          <div className="ml-2">
            <Tooltip title="Show In Print Out">
              <Checkbox checked={ShowInPrintOut} onChange={handleChange} />
            </Tooltip>
          </div>

          {/* <Input
            onChange={(v) => {
              setResult(v.target.value.toUpperCase());
            }}
            onBlur={handleSave}
            value={result}
          /> */}
        </div>
        <div>{data.IsReferenceValue}</div>
        {/* <div>{data.ResultConventional}</div>
        <div>{data.ConventionalReferenceValue}</div> */}
        {data.ShowHighLow === "Y" && (
          <div className="font-bold">{data.Flag}</div>
        )}
      </div>
    </>
  );
};

export default LabResult;
