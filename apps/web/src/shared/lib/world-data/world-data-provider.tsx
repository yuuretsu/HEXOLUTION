import type { FC, PropsWithChildren } from "react";
import { useSubscribeWorldData } from "./use-subscribe-world-data";
import { WorldDataContext } from "./use-world-data";

export const WorldDataProvider: FC<PropsWithChildren> = ({ children }) => {
  const value = useSubscribeWorldData();
  return (
    <WorldDataContext.Provider value={value}>
      {children}
    </WorldDataContext.Provider>
  );
};
