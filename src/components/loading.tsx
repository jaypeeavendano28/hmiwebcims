import Lottie from "lottie-react";
import loadingx from "../assets/loading.json";
import { FC } from "react";
type Props = {
  size: number;
};
const Loading: FC<Props> = ({ size }) => {
  return (
    <>
      <Lottie animationData={loadingx} loop={true} style={{ height: size }} />
    </>
  );
};

export default Loading;
