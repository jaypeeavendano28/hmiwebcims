import {
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { AuthContext } from "../hooks/userAuth";
import Sider from "../components/Sider";
import { Layout } from "antd";
import useAppStore from "../store";
import notfound from "../components/notfound";
import { useEffect } from "react";

type RouterContext = {
  authentication: AuthContext;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: notfound,
});

function RootComponent() {
  const store = useAppStore();
  const search = useRouterState({
    select: (state) => state.location.search,
  }) as { standalone?: boolean | string };
  const isStandalone =
    search.standalone === true || search.standalone === "true";
  const hideSidebar = store.hideSideBar === "Y" || isStandalone;

  useEffect(() => {
    store.setCollapsed(false);
  }, []);
  return (
    <div>
      <Layout style={{ minHeight: "100vh" }}>
        {!hideSidebar && <Sider />}

        {/* store.collapsed  ? { marginLeft: 0 } : { marginLeft: 200 } */}
        <Layout
        // style={
        //   store.hideSideBar === "Y"
        //     ? { margin: 0 }
        //     : store.collapsed
        //       ? { marginLeft: 72 }
        //       : { marginLeft: 200 }
        // }
        >
          {/* : { margin: "24px 16px 0", overflow: "initial" } */}
          <Layout.Content
            style={
              hideSidebar
                ? { margin: 0 }
                : { margin: "24px 16px 0", overflow: "initial" }
            }
          >
            <div>
              <Outlet />
            </div>
          </Layout.Content>
          <Layout.Footer style={{ textAlign: "center" }}>
            WebCims ©{new Date().getFullYear()} Created by New Comlogik
            Business Systems
          </Layout.Footer>
        </Layout>
      </Layout>
    </div>
  );
}
