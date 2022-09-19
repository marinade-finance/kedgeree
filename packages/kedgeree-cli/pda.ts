import { parsePubkey } from '@marinade.finance/solana-cli-utils';
import { PublicKey } from '@solana/web3.js';
import { Command } from 'commander';
import { useContext } from './context';
import { encode } from '@project-serum/anchor/dist/cjs/utils/bytes/utf8';

export function installCreatePDAInfo(program: Command) {
  program
    .command('create-pda-info')
    .requiredOption('--owner <pubkey>', 'Owner', parsePubkey)
    .requiredOption(
      '--seed <seed...>',
      'Seeds',
      (value, acc: (Buffer | Uint8Array)[] = []) => {
        try {
          acc.push(new PublicKey(value).toBuffer());
        } catch (e) {
          acc.push(encode(value));
        }
        return acc;
      }
    )
    .action(
      async ({
        owner,
        seed,
      }: {
        owner: Promise<PublicKey>;
        seed: (Buffer | Uint8Array)[];
      }) => {
        const { sdk, simulate } = useContext();
        const { tx, key } = await sdk.createPDAInfo({
          owner: await owner,
          seeds: seed,
        });

        if (simulate) {
          console.log(`Simulating info for key ${key.toBase58()}`);
          console.log(tx.debugStr);
          console.log((await tx.simulate()).value.logs);
        } else {
          const result = await tx.confirm();
          console.log(
            `Creating info for key ${key.toBase58()}: ${result.signature}`
          );
        }
      }
    );
}
