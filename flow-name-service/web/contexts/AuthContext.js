import * as fcl from "@onflow/fcl";
import { createContext, useContext, useEffect, useState } from "react";
import { checkIsInitialized, IS_INITIALIZED } from "../flow/scripts";

export const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [currentUser, setUser] = useState({
    loggedIn: false,
    addr: undefined,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => fcl.currentUser.subscribe(setUser), []);

  useEffect(() => {
    if (currentUser.addr) {
      checkInit();
    }
  }, [currentUser]);

  const logOut = async () => {
    fcl.unauthenticate();
    setUser({ loggedIn: false, addr: undefined });
  };

  const logIn = () => {
    fcl.logIn();
  };

  const checkInit = async () => {
    const isInit = await checkIsInitialized(currentUser.addr);
    setIsInitialized(isInit);
  };

  const value = {
    currentUser,
    isInitialized,
    checkInit,
    logOut,
    logIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
