import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FC, ReactNode } from "react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import type { Umi } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import type { WalletContextState } from "@solana/wallet-adapter-react";

import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";

interface Props {
  children: ReactNode;
  endpoint: string;
  wallet: WalletContextState;
}

const UmiContext = createContext<Umi | null>(null);

export const UmiProvider: FC<Props> = ({ children, endpoint, wallet }) => {
  const umi = useMemo(() => {
    return createUmi(endpoint).use(mplTokenMetadata());
  }, [endpoint]);

  const [withIdentity, setWithIdentity] = useState<Umi>(umi);

  useEffect(() => {
    let next = umi;
    if (wallet?.publicKey && wallet?.signTransaction) {
      next = umi.use(walletAdapterIdentity(wallet));
    }
    setWithIdentity(next);
  }, [umi, wallet]);

  return (
    <UmiContext.Provider value={withIdentity}>{children}</UmiContext.Provider>
  );
};

export const useUmi = (): Umi => {
  const ctx = useContext(UmiContext);
  if (!ctx) throw new Error("Umi not available");
  return ctx;
};
