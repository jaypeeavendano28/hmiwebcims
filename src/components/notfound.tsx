import Lottie from "lottie-react";
import notfoundx from "../assets/404.json";
const notfound = () => {
  return (
    <>
      <Lottie
        animationData={notfoundx}
        loop={true}
        style={{ height: "500px" }}
      />
    </>
  );
};

export default notfound;
