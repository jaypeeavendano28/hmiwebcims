import { AutoComplete, Checkbox, CheckboxProps, Input, Tooltip } from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { isNullOrUndefinedOrBlank, PostData } from "../helpers";

type Props = {
  data: any;
  handleSaveResult: (v: any, submitAfterSave?: boolean) => void;
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

const isHeaderRow = (value: any) =>
  value === true ||
  String(value ?? "")
    .trim()
    .toUpperCase() === "Y";

const LabResult: FC<Props> = ({ data, handleSaveResult, ResultId }) => {
  const [ShowInPrintOut, setShowInPrintOut] = useState(false);
  const suffix = isNullOrUndefinedOrBlank(data.Suffix)
    ? undefined
    : data.Suffix;
  const isHeader = isHeaderRow(data.IsHeader);
  const [result, setResult] = useState(stripResultSuffix(data.ResultSi, suffix));
  const [possibleValues, setPossibleValues] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<
    number | null
  >(null);
  const skipNextBlurSaveRef = useRef(false);
  const keyboardSearchValueRef = useRef<string | null>(null);

  const possibleValueOptions = possibleValues.map((v: any) => ({
    value: v.Value,
    label: v.Value,
  }));

  const getFilteredPossibleValueOptions = (value = result) => {
    const inputValue = getResultText(value).toUpperCase();

    if (inputValue === "") {
      return possibleValueOptions;
    }

    return possibleValueOptions.filter((option) =>
      option.value
        ?.toString()
        .toUpperCase()
        .includes(inputValue)
    );
  };

  const saveResultValue = (value: any, submitAfterSave = false) => {
    const resultToSave = stripResultSuffix(value, suffix);
    const showInPrintOut = isHeader
      ? ShowInPrintOut
      : !isNullOrUndefinedOrBlank(resultToSave);
    setShowInPrintOut(showInPrintOut);
    setResult(resultToSave);
    handleSaveResult({
      ...data,
      ResultSi: resultToSave,
      ShowInPrintOut: showInPrintOut,
    }, submitAfterSave);
  };

  const handleSave = async (submitAfterSave = false) => {
    saveResultValue(result, submitAfterSave);
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

    if (!isHeader) {
      setShowInPrintOut(!isNullOrUndefinedOrBlank(data.ResultSi));
    } else if (isNullOrUndefinedOrBlank(data.ShowInPrintOut)) {
      setShowInPrintOut(true);
    } else if (ResultId > 0) {
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
            defaultActiveFirstOption={false}
            open={
              isFocused &&
              data.IsWithResult !== "N" &&
              possibleValueOptions.length > 0
            }
            options={possibleValueOptions}
            filterOption={(inputValue, option) =>
              option!
                .value!.toString()
                .toUpperCase()
                .indexOf(inputValue.toUpperCase()) !== -1
            }
            style={{ width: "100%" }}
            value={result}
            onChange={(v) => {
              skipNextBlurSaveRef.current = false;
              setActiveSuggestionIndex(null);
              keyboardSearchValueRef.current = null;
              setResult(v);
            }}
            onFocus={() => {
              setIsFocused(true);
              setActiveSuggestionIndex(null);
              keyboardSearchValueRef.current = null;
            }}
            onSelect={() => {
              setActiveSuggestionIndex(null);
              keyboardSearchValueRef.current = null;
            }}
            onBlur={() => {
              setIsFocused(false);
              keyboardSearchValueRef.current = null;
              if (skipNextBlurSaveRef.current) {
                skipNextBlurSaveRef.current = false;
                return;
              }

              void handleSave();
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                if (keyboardSearchValueRef.current === null) {
                  keyboardSearchValueRef.current = result;
                }

                const filteredOptions = getFilteredPossibleValueOptions(
                  keyboardSearchValueRef.current
                );

                if (filteredOptions.length > 0) {
                  setActiveSuggestionIndex((current) => {
                    let nextIndex: number;

                    if (current === null) {
                      nextIndex = event.key === "ArrowDown"
                        ? 0
                        : filteredOptions.length - 1;
                    } else {
                      nextIndex =
                        event.key === "ArrowDown"
                          ? (current + 1) % filteredOptions.length
                          : (current - 1 + filteredOptions.length) %
                            filteredOptions.length;
                    }

                    return nextIndex;
                  });
                }
              }

              if (event.key === "Tab") {
                const inputValue = getResultText(result).trim();
                let selectedOption =
                  activeSuggestionIndex === null
                    ? undefined
                    : getFilteredPossibleValueOptions(
                        keyboardSearchValueRef.current ?? result
                      )[activeSuggestionIndex];

                if (!selectedOption && inputValue !== "") {
                  const normalizedInput = inputValue.toUpperCase();
                  selectedOption = possibleValueOptions.find(
                    (option) =>
                      getResultText(option.value).trim().toUpperCase() ===
                      normalizedInput
                  );

                  if (!selectedOption && inputValue.length === 1) {
                    selectedOption = possibleValueOptions.find((option) =>
                      getResultText(option.value)
                        .trim()
                        .toUpperCase()
                        .startsWith(normalizedInput)
                    );
                  }
                }

                if (selectedOption) {
                  saveResultValue(selectedOption.value);
                  skipNextBlurSaveRef.current = true;
                  setActiveSuggestionIndex(null);
                  keyboardSearchValueRef.current = null;
                }
              }

              if (event.key === "Enter") {
                event.preventDefault();
                keyboardSearchValueRef.current = null;
                void handleSave(true);
              }
            }}
            disabled={data.IsWithResult === "N"}
          >
            <Input suffix={suffix} disabled={data.IsWithResult === "N"} />
          </AutoComplete>
          {isHeader && (
            <div className="ml-2">
              <Tooltip title="Show In Print Out">
                <Checkbox checked={ShowInPrintOut} onChange={handleChange} />
              </Tooltip>
            </div>
          )}

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
