import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ConfigProvider } from "antd";
import { StyleProvider } from "@ant-design/cssinjs";
import "primeicons/primeicons.css";
import { PrimeReactProvider } from "primereact/api";
// import "primeflex/primeflex.css";
import "primereact/resources/primereact.css";
import "primereact/resources/themes/fluent-light/theme.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#0967a4",
      },
    }}
  >
    <StyleProvider hashPriority="high">
      <PrimeReactProvider>
        <App />
      </PrimeReactProvider>
    </StyleProvider>
  </ConfigProvider>
  // </React.StrictMode>
);
