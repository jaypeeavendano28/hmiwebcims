import Lottie from "lottie-react";
import callingx from "../assets/calling2.json";
import { FC } from "react";
type Props = {
  size: number;
};
const Calling2: FC<Props> = ({ size }) => {
  return (
    <>
      <Lottie animationData={callingx} loop={true} style={{ height: size }} />
    </>
  );
};

export default Calling2;
