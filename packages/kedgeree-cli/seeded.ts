import { parsePubkey } from '@marinade.finance/solana-cli-utils';
import { PublicKey } from '@solana/web3.js';
import { Command } from 'commander';
import { useContext } from './context';

export function installCreateSeededInfo(program: Command) {
  program
    .command('create-seeded-info')
    .requiredOption('--owner <pubkey>', 'Owner', parsePubkey)
    .requiredOption('--base <pubkey>', 'Base', parsePubkey)
    .requiredOption('--seeds <string>', 'Seeds')
    .action(
      async ({
        owner,
        base,
        seeds,
      }: {
        owner: Promise<PublicKey>;
        base: Promise<PublicKey>;
        seeds: string;
      }) => {
        const { sdk, simulate } = useContext();
        const { tx, key } = await sdk.createSeededInfo({
          owner: await owner,
          base: await base,
          seeds,
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
