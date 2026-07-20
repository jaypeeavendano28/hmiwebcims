import { AutoComplete, Checkbox, CheckboxProps, Input, Tooltip } from "antd";
import { FC, useEffect, useState } from "react";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";

type Props = {
  data: any;
  handleSaveResult: (v: any) => void;
  ResultId: number;
};

const getResultText = (value: any) => {
  if (isNullOrUndefinedOrBlank(value)) {
    return "";
  }

  return value.toString().trim();
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripResultSuffix = (value: any, suffix: any) => {
  const resultText = getResultText(value);
  const suffixText = getResultText(suffix);

  if (resultText === "" || suffixText === "") {
    return resultText;
  }

  const suffixVariants = [
    suffixText,
    suffixText.startsWith("/") ? suffixText.slice(1) : `/${suffixText}`,
  ].filter((item) => item !== "");

  for (const suffixVariant of suffixVariants) {
    const prefixPattern = /[^A-Za-z0-9]/.test(suffixVariant)
      ? "\\s*"
      : "(?:^|\\s+)";
    const suffixPattern = new RegExp(
      `${prefixPattern}${escapeRegExp(suffixVariant)}\\s*$`,
      "i"
    );

    if (suffixPattern.test(resultText)) {
      return resultText.replace(suffixPattern, "").trim();
    }
  }

  return resultText;
};

const LabResult: FC<Props> = ({ data, handleSaveResult, ResultId }) => {
  const [ShowInPrintOut, setShowInPrintOut] = useState(false);
  const suffix = isNullOrUndefinedOrBlank(data.Suffix)
    ? undefined
    : data.Suffix;
  const [result, setResult] = useState(stripResultSuffix(data.ResultSi, suffix));
  const [possibleValues, setPossibleValues] = useState<any[]>([]);

  const getPossibleValueTexts = () =>
    possibleValues
      .map((item: any) => item.Value)
      .filter((item: any) => !isNullOrUndefinedOrBlank(item))
      .map((item: any) => item.toString());

  const getFirstMatchingPossibleValue = (value: any) => {
    const typedValue = getResultText(value);
    const searchValue = typedValue.toUpperCase();
    if (searchValue === "") {
      return undefined;
    }

    const values = getPossibleValueTexts();

    const exactMatch = values.find(
      (item: string) => item.toUpperCase() === searchValue
    );

    if (exactMatch) {
      return exactMatch;
    }

    const startsWithMatch = values.find((item: string) =>
      item.toUpperCase().startsWith(searchValue)
    );

    if (startsWithMatch) {
      return startsWithMatch;
    }

    return (
      values.find((item: string) => item.toUpperCase().includes(searchValue)) ??
      undefined
    );
  };

  const addPossibleValueIfMissing = async (value: string) => {
    if (possibleValues.length === 0 || isNullOrUndefinedOrBlank(data.TestId)) {
      return;
    }

    const nextValue = getResultText(value);
    if (nextValue === "") {
      return;
    }

    const valueExists = getPossibleValueTexts().some(
      (item: string) => item.trim().toUpperCase() === nextValue.toUpperCase()
    );

    if (valueExists) {
      return;
    }

    const res = await PostData("AddPossibleValues", {
      Id: 0,
      TestId: data.TestId,
      Value: nextValue,
    });

    if (res?.status === 1) {
      handleGetPossibleValues();
    }
  };

  const handleSave = async () => {
    const cleanResult = stripResultSuffix(result, suffix);
    const matchedPossibleValue = getFirstMatchingPossibleValue(cleanResult);
    const resultToSave = stripResultSuffix(
      matchedPossibleValue ?? cleanResult,
      suffix
    );
    let showInPrintOut: boolean = ShowInPrintOut;
    if (!isNullOrUndefinedOrBlank(resultToSave)) {
      showInPrintOut = true;
    } else {
      showInPrintOut = false;
    }
    setShowInPrintOut(showInPrintOut);
    setResult(resultToSave);
    handleSaveResult({
      ...data,
      ResultSi: resultToSave,
      ShowInPrintOut: showInPrintOut,
    });

    if (!matchedPossibleValue) {
      await addPossibleValueIfMissing(resultToSave);
    }
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
      ResultSi: stripResultSuffix(result, suffix),
      ShowInPrintOut: e.target.checked,
    });
    // handleSave()
  };
  useEffect(() => {
    handleGetPossibleValues();
    setResult(stripResultSuffix(data.ResultSi, suffix));

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
            options={possibleValues.map((v: any) => ({
              value: v.Value,
              label: v.Value,
            }))}
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
            <Input suffix={suffix} disabled={data.IsWithResult === "N"} />
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
