import { FC, useEffect, useState } from "react";
import { TCurrentDepartment } from "../types";
import { PostData } from "../helpers";
import useAppStore from "../store";
import dayjs from "dayjs";

type Props = {
  CurrentDepartment: TCurrentDepartment;
};

const QPatients: FC<Props> = ({ CurrentDepartment }) => {
  const [listOfPatients, setListOfPatients] = useState([]);
  const store = useAppStore();

  const handleGetPatients = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPatientsPerCounter2",
      parameters: {
        BranchCode: store.branchCode,
        CounterCode: CurrentDepartment.CounterCode,
        DateFrom: dayjs().format("YYYYMMDD"),
        DateTo: dayjs().format("YYYYMMDD"),
      },
    });
    if (res) {
      setListOfPatients(res.parameters.lst);
    }
  };

  useEffect(() => {
    handleGetPatients();
  }, [CurrentDepartment]);
  return (
    <div className="bg-green-500">
      <div className="font-bold text-6xl text-yellow-100 text-center">
        {CurrentDepartment.CounterName2}
      </div>

      {listOfPatients.map((v: any) => (
        <div className="grid  lg:grid-cols-2" key={v.Id}>
          <div className="grid  lg:grid-cols-2 gap-4">
            <div className="font-bold text-6xl text-yellow-100 text-center">
              {v.QueueNo}
            </div>
            <div className="font-bold text-6xl text-yellow-100 text-center">
              {v.StatusDesc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QPatients;
