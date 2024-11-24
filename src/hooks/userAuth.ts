import Cookies from "js-cookie";
import { WithAccess, isNullOrUndefinedOrBlank } from "../helpers";
import useAppStore from "../store";
export const useAuth = () => {
  const store = useAppStore();
  const signIn = (tokenId: string) => {
    Cookies.set("WebCimsTokenId", tokenId);
  };

  const signOut = () => {
    Cookies.remove("WebCimsTokenId");
  };

  // const isLogged = () => false;
  function isLogged() {
    !isNullOrUndefinedOrBlank(Cookies.get("WebCimsTokenId")) === true;
    if (!isNullOrUndefinedOrBlank(Cookies.get("WebCimsTokenId"))) {
      return true;
    } else {
      return false;
    }
  }

  const isWithAccess = async (ModuleId: number) => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: ModuleId,
      },
    });
    if (res) {
      if (res.status === 0) {
        return false;
      } else {
        return true;
      }
    }
  };

  return { signIn, signOut, isLogged, isWithAccess };
};

export type AuthContext = ReturnType<typeof useAuth>;
