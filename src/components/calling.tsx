import Lottie from "lottie-react";
import callingx from "../assets/calling.json";
import { FC } from "react";
type Props = {
  size: number;
};
const Calling: FC<Props> = ({ size }) => {
  return (
    <>
      <Lottie animationData={callingx} loop={true} style={{ height: size }} />
    </>
  );
};

export default Calling;
