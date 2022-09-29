import * as generated from './generated/target/types/kedgeree';
import { AnchorTypes, makeAnchorProvider } from '@saberhq/anchor-contrib';
import {
  AugmentedProvider,
  Provider,
  PublicKey,
  SolanaAugmentedProvider,
  TransactionEnvelope,
} from '@saberhq/solana-contrib';
import * as anchor from '@project-serum/anchor';
import { encode } from '@project-serum/anchor/dist/cjs/utils/bytes/utf8';
import { SystemProgram } from '@solana/web3.js';

export type KedgereeTypes = AnchorTypes<
  generated.Kedgeree,
  {
    keyInfo: KeyInfoData;
  }
>;

type KedgereeAccounts = KedgereeTypes['Accounts'];
export type KeyInfoData = KedgereeAccounts['keyInfo'];
export type KedgereeProgram = KedgereeTypes['Program'];

const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};

export class KedgereeSDK {
  readonly provider: AugmentedProvider;
  readonly program: KedgereeProgram;

  constructor({
    provider,
    kedgereeId = new PublicKey('kedgrkbZ5TcjRz2fSpZMcasWzyxd8SuEaXoGfbkPddc'),
  }: {
    provider: Provider;
    kedgereeId?: PublicKey;
  }) {
    this.provider = new SolanaAugmentedProvider(provider);
    const anchorProvider = makeAnchorProvider(provider);
    this.program = new anchor.Program(
      generated.IDL,
      kedgereeId,
      anchorProvider
    ) as unknown as KedgereeProgram;
  }

  async keyInfoAddress(key: PublicKey): Promise<PublicKey> {
    const [address] = await PublicKey.findProgramAddress(
      [encode('info'), key.toBytes()],
      this.program.programId
    );
    return address;
  }

  async loadKeyInfo(key: PublicKey): Promise<KeyInfoData | null> {
    return this.program.account.keyInfo.fetchNullable(
      await this.keyInfoAddress(key)
    );
  }

  async createPDAInfo({
    owner,
    seeds,
  }: {
    owner: PublicKey;
    seeds: (Buffer | Uint8Array)[];
  }): Promise<{ tx: TransactionEnvelope; key: PublicKey }> {
    const [key, bump] = await PublicKey.findProgramAddress(seeds, owner);
    const keyInfo = await this.keyInfoAddress(key);
    let buffer = Buffer.alloc(0);
    seeds.forEach(seed => {
      buffer = Buffer.concat([buffer, toBuffer(seed)]);
    });
    const tx = new TransactionEnvelope(this.provider, [
      await this.program.methods
        .writePdaInfo(key, owner, buffer, bump)
        .accounts({
          keyInfo,
          payer: this.provider.walletKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction(),
    ]);
    return {
      tx,
      key,
    };
  }

  async createSeededInfo({
    owner,
    seeds,
    base,
  }: {
    owner: PublicKey;
    seeds: string;
    base: PublicKey;
  }): Promise<{ tx: TransactionEnvelope; key: PublicKey }> {
    const key = await PublicKey.createWithSeed(base, seeds, owner);
    const keyInfo = await this.keyInfoAddress(key);
    const tx = new TransactionEnvelope(this.provider, [
      await this.program.methods
        .writeSeededInfo(key, owner, seeds, base)
        .accounts({
          keyInfo,
          payer: this.provider.walletKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction(),
    ]);
    return {
      tx,
      key,
    };
  }
}
