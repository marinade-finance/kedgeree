import { AnchorProvider } from '@project-serum/anchor';
import { SolanaProvider } from '@saberhq/solana-contrib';
import { Keypair } from '@solana/web3.js';
import { KedgereeSDK } from '../sdk';
import { encode } from '@project-serum/anchor/dist/cjs/utils/bytes/utf8';

jest.setTimeout(30000);

describe('Seeded account info writer', () => {
  const anchorProvider = AnchorProvider.env();
  const sdk = new KedgereeSDK({
    provider: SolanaProvider.init({
      connection: anchorProvider.connection,
      wallet: anchorProvider.wallet,
      opts: anchorProvider.opts,
    }),
  });

  it('Creates key info for seeded account', async () => {
    const owner = new Keypair().publicKey;
    const base = new Keypair().publicKey;
    const seeds = 'You are so beautiful';
    const { tx, key } = await sdk.createSeededInfo({
      owner,
      seeds,
      base,
    });
    await expect(tx.confirm().then(r => r.signature)).resolves.toBeTruthy();
    await expect(sdk.loadKeyInfo(key)).resolves.toBeTruthy();
    const keyInfo = await sdk.loadKeyInfo(key);
    expect(keyInfo.base.toBase58()).toBe(base.toBase58());
    expect(keyInfo.key.toBase58()).toBe(key.toBase58());
    expect(keyInfo.owner.toBase58()).toBe(owner.toBase58());
    expect(Array.from(keyInfo.seeds)).toEqual(Array.from(encode(seeds)));
  });
});
