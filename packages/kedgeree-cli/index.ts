import { Command } from 'commander';
import { Keypair } from '@solana/web3.js';
import { setContext } from './context';
import { parseKeypair } from '@marinade.finance/solana-cli-utils';
import { installCreatePDAInfo } from './pda';
import { installCreateSeededInfo } from './seeded';
import { installShow } from './show';

const program = new Command();

program
  .version('1.0.0')
  .allowExcessArguments(false)
  .option('-c, --cluster <cluster>', 'Solana cluster', 'http://localhost:8899')
  .option('--commitment <commitment>', 'Commitment', 'confirmed')
  .option('-k, --keypair <keypair>', 'Wallet keypair', parseKeypair)
  .option('-s, --simulate', 'Simulate')
  .hook('preAction', async (command: Command) => {
    const wallet = command.opts().keypair;
    const walletKP = wallet
      ? ((await wallet) as Keypair)
      : await parseKeypair('~/.config/solana/id.json');
    setContext({
      cluster: command.opts().cluster as string,
      walletKP,
      simulate: Boolean(command.opts().simulate),
    });
  });

installCreatePDAInfo(program);
installCreateSeededInfo(program);
installShow(program);

program.parseAsync(process.argv).then(
  () => {},
  (err: unknown) => {
    throw err;
  }
);
