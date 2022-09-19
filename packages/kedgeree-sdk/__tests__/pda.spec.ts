import { AnchorProvider } from '@project-serum/anchor';
import { SolanaProvider } from '@saberhq/solana-contrib';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { KedgereeSDK } from '../sdk';

jest.setTimeout(30000);

describe('PDA info writer', () => {
  const anchorProvider = AnchorProvider.env();
  const sdk = new KedgereeSDK({
    provider: SolanaProvider.init({
      connection: anchorProvider.connection,
      wallet: anchorProvider.wallet,
      opts: anchorProvider.opts,
    }),
  });

  it('Creates key info for PDA', async () => {
    const owner = new Keypair().publicKey;
    const seeds = [new Uint8Array([0, 22, 46]), new Uint8Array([1, 255])];
    const { tx, key } = await sdk.createPDAInfo({
      owner,
      seeds,
    });
    await expect(tx.confirm().then(r => r.signature)).resolves.toBeTruthy();
    await expect(sdk.loadKeyInfo(key)).resolves.toBeTruthy();
    const keyInfo = await sdk.loadKeyInfo(key);
    expect(keyInfo.base.toBase58()).toBe(SystemProgram.programId.toBase58());
    expect(keyInfo.key.toBase58()).toBe(key.toBase58());
    expect(keyInfo.owner.toBase58()).toBe(owner.toBase58());
    expect(Array.from(keyInfo.seeds)).toEqual([0, 22, 46, 1, 255]);
  });

  it('Creates key info for PDA with long seed', async () => {
    const owner = new Keypair().publicKey;
    const seeds: Uint8Array[] = [];
    const expectedSeeds = [];
    for (let i = 0; i < 4; i++) {
      const p = [];
      for (let j = 0; j < 32; j++) {
        p.push(j);
        expectedSeeds.push(j);
      }
      seeds.push(new Uint8Array(p));
    }
    const { tx, key } = await sdk.createPDAInfo({
      owner,
      seeds,
    });
    await expect(tx.confirm().then(r => r.signature)).resolves.toBeTruthy();
    await expect(sdk.loadKeyInfo(key)).resolves.toBeTruthy();
    const keyInfo = await sdk.loadKeyInfo(key);
    expect(keyInfo.base.toBase58()).toBe(SystemProgram.programId.toBase58());
    expect(keyInfo.key.toBase58()).toBe(key.toBase58());
    expect(keyInfo.owner.toBase58()).toBe(owner.toBase58());
    expect(Array.from(keyInfo.seeds)).toEqual(expectedSeeds);
  });
});
