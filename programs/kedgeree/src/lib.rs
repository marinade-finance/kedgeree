use anchor_lang::{prelude::*, solana_program::pubkey::PubkeyError};

declare_id!("kedgrkbZ5TcjRz2fSpZMcasWzyxd8SuEaXoGfbkPddc");

#[error_code]
pub enum ErrorCode {
    /// Length of the seed is too long for address generation
    #[msg("Length of the seed is too long for address generation")]
    MaxSeedLengthExceeded,
    #[msg("Provided seeds do not result in a valid address")]
    InvalidSeeds,
    #[msg("Provided owner is not allowed")]
    IllegalOwner,
    #[msg("Wrong utf8 seed")]
    WrongUtf8Seed,
    #[msg("Wrong key")]
    WrongKey,
    #[msg("Wrong bump")]
    WrongBump,
    #[msg("Invalid base")]
    InvalidBase,
}

impl From<PubkeyError> for ErrorCode {
    fn from(e: PubkeyError) -> Self {
        match e {
            PubkeyError::MaxSeedLengthExceeded => ErrorCode::MaxSeedLengthExceeded,
            PubkeyError::InvalidSeeds => ErrorCode::InvalidSeeds,
            PubkeyError::IllegalOwner => ErrorCode::IllegalOwner,
        }
    }
}

#[program]
pub mod kedgeree {
    use anchor_lang::solana_program::pubkey::MAX_SEED_LEN;

    use super::*;

    pub fn write_pda_info(
        ctx: Context<WriteKeyInfo>,
        key: Pubkey,
        owner: Pubkey,
        seeds: Vec<u8>,
        bump: u8,
    ) -> Result<()> {
        let (expected_key, expected_bump) =
            Pubkey::find_program_address(&seeds.chunks(MAX_SEED_LEN).collect::<Vec<_>>(), &owner);
        if bump != expected_bump {
            return err!(ErrorCode::WrongBump);
        }
        if key != expected_key {
            msg!("Expected {} key got {}", expected_key, key);
            return err!(ErrorCode::WrongKey);
        }
        ctx.accounts.key_info.set_inner(KeyInfo {
            key,
            base: Pubkey::default(),
            owner,
            seeds,
            bump,
        });
        Ok(())
    }

    pub fn write_seeded_info(
        ctx: Context<WriteKeyInfo>,
        key: Pubkey,
        owner: Pubkey,
        seeds: String,
        base: Pubkey,
    ) -> Result<()> {
        if base == Pubkey::default() {
            return err!(ErrorCode::InvalidBase);
        }
        let expected_key =
            Pubkey::create_with_seed(&base, &seeds, &owner).map_err(ErrorCode::from)?;
        if key != expected_key {
            msg!("Expected {} key got {}", expected_key, key);
            return err!(ErrorCode::WrongKey);
        }
        ctx.accounts.key_info.set_inner(KeyInfo {
            key,
            base,
            owner,
            seeds: seeds.as_bytes().to_vec(),
            bump: 0,
        });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(key: Pubkey, owner: Pubkey, seeds: Vec<u8>)]
pub struct WriteKeyInfo<'info> {
    #[account(
        init,
        seeds = [KeyInfo::INFO_ADDRESS_SEED, &key.to_bytes()],
        bump,
        payer = payer,
        space = 8 + 32 + 32 + 32 + 4 + seeds.len() + 1
    )]
    pub key_info: Account<'info, KeyInfo>,
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct KeyInfo {
    key: Pubkey,
    base: Pubkey,  // Pubkey::default() for PDA
    owner: Pubkey, // program for PDA
    seeds: Vec<u8>,
    bump: u8,
}

impl KeyInfo {
    pub const INFO_ADDRESS_SEED: &'static [u8] = b"info";
}
