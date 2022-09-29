import { parsePubkey } from '@marinade.finance/solana-cli-utils';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Command } from 'commander';
import { useContext } from './context';
import { decode } from '@project-serum/anchor/dist/cjs/utils/bytes/utf8';

export function installShow(program: Command) {
  program
    .command('show')
    .requiredOption('--key <pubkey>', 'Key', parsePubkey)
    .action(async ({ key }: { key: Promise<PublicKey> }) => {
      const { sdk } = useContext();
      const address = await key;
      console.log(`Key ${address.toBase58()} is`);
      const keyInfo = await sdk.loadKeyInfo(address);
      if (!keyInfo) {
        console.log('No info');
        return;
      }
      if (keyInfo.base.equals(SystemProgram.programId)) {
        console.log(
          `PDA prog=${keyInfo.owner.toBase58()} seeds=${Buffer.from(
            keyInfo.seeds
          ).toString('hex')}`
        );
      } else {
        console.log(
          `Seeded base=${keyInfo.base.toBase58()} seeds=${decode(
            keyInfo.seeds
          )} owner=${keyInfo.owner.toBase58()}`
        );
      }
    });
}
