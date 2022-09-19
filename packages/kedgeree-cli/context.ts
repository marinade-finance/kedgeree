import { SignerWallet, SolanaProvider } from '@saberhq/solana-contrib';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { KedgereeSDK } from '@marinade.finance/kedgeree-sdk';

export interface Context {
  sdk: KedgereeSDK;
  simulate: boolean;
}

const context: {
  sdk: KedgereeSDK | null;
  simulate: boolean;
} = {
  sdk: null,
  simulate: false,
};

export const setContext = ({
  cluster,
  walletKP,
  simulate,
}: {
  cluster: string;
  walletKP: Keypair;
  simulate: boolean;
}) => {
  const provider = SolanaProvider.init({
    connection: new Connection(cluster, 'confirmed'),
    wallet: new SignerWallet(walletKP),
  });
  context.sdk = new KedgereeSDK({
    provider,
  });
  context.simulate = simulate;
};

export const useContext = () => {
  return context as Context;
};
