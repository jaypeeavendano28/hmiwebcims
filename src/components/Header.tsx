import { FC } from "react";
import { Image } from "antd";
import logo from "../assets/logo.jpg";
const Header: FC = () => {
  return (
    <>
      <div className="text-center">
        <Image width={300} src={logo} preview={false} />
        <div className="font-bold text-2xl">Clinic and Diagnostic Center</div>
      </div>
    </>
  );
};

export default Header;
