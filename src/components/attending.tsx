import Lottie from "lottie-react";
import callingx from "../assets/attending.json";
import { FC } from "react";
type Props = {
  size: number;
};
const Attending: FC<Props> = ({ size }) => {
  return (
    <>
      <Lottie animationData={callingx} loop={true} style={{ height: size }} />
    </>
  );
};

export default Attending;
