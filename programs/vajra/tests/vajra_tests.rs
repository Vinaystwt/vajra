#![allow(unused_imports)]
use anchor_lang::{
    solana_program::instruction::Instruction, AccountDeserialize, InstructionData, ToAccountMetas,
};
use litesvm::LiteSVM;
use solana_account::Account as SolanaAccount;
use solana_keypair::Keypair;
use solana_message::Message;
use solana_program_option::COption;
use solana_program_pack::Pack;
use solana_rent::Rent;
use solana_signer::Signer;
use solana_transaction::Transaction;
use spl_associated_token_account_interface::address::get_associated_token_address_with_program_id;
use spl_token_interface::{
    state::{Account as TokenAccount, AccountState, Mint},
    ID as TOKEN_PROGRAM_ID,
};

type Pubkey = anchor_lang::prelude::Pubkey;

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn make_svm() -> LiteSVM {
    let mut svm = LiteSVM::new()
        .with_default_programs()
        .with_transaction_history(0); // allow duplicate tx in tests
    let bytes = include_bytes!("../../../target/deploy/vajra.so");
    svm.add_program(vajra::id(), bytes).unwrap();
    svm
}

fn airdrop(svm: &mut LiteSVM, pk: &Pubkey) {
    svm.airdrop(pk, 100_000_000_000).unwrap();
}

fn create_mint(svm: &mut LiteSVM, payer: &Keypair, authority: &Pubkey, decimals: u8) -> Keypair {
    let mint_kp = Keypair::new();
    let rent = svm.get_sysvar::<Rent>();
    let lamports = rent.minimum_balance(Mint::LEN);
    let create_acc = solana_system_interface::instruction::create_account(
        &payer.pubkey(),
        &mint_kp.pubkey(),
        lamports,
        Mint::LEN as u64,
        &TOKEN_PROGRAM_ID,
    );
    let init_mint = spl_token_interface::instruction::initialize_mint2(
        &TOKEN_PROGRAM_ID,
        &mint_kp.pubkey(),
        authority,
        None,
        decimals,
    )
    .unwrap();
    let tx = Transaction::new_signed_with_payer(
        &[create_acc, init_mint],
        Some(&payer.pubkey()),
        &[payer, &mint_kp],
        svm.latest_blockhash(),
    );
    svm.send_transaction(tx).unwrap();
    mint_kp
}

fn inject_token_account(
    svm: &mut LiteSVM,
    address: &Pubkey,
    mint: &Pubkey,
    owner: &Pubkey,
    amount: u64,
) {
    let rent = svm.get_sysvar::<Rent>();
    let token_acc = TokenAccount {
        mint: *mint,
        owner: *owner,
        amount,
        delegate: COption::None,
        state: AccountState::Initialized,
        is_native: COption::None,
        delegated_amount: 0,
        close_authority: COption::None,
    };
    let mut data = vec![0u8; TokenAccount::LEN];
    TokenAccount::pack(token_acc, &mut data).unwrap();
    svm.set_account(
        *address,
        SolanaAccount {
            lamports: rent.minimum_balance(TokenAccount::LEN),
            data,
            owner: TOKEN_PROGRAM_ID,
            executable: false,
            rent_epoch: 0,
        },
    )
    .unwrap();
}

fn get_token_amount(svm: &LiteSVM, address: &Pubkey) -> u64 {
    let acc = svm.get_account(address).unwrap();
    TokenAccount::unpack(&acc.data).unwrap().amount
}

fn policy_pda(owner: &Pubkey, policy_id: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"vajra_policy", owner.as_ref(), &policy_id.to_le_bytes()],
        &vajra::id(),
    )
}

fn dest_rule_pda(policy: &Pubkey, dest: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"vajra_dest", policy.as_ref(), dest.as_ref()],
        &vajra::id(),
    )
}

fn vault_ata(policy: &Pubkey, mint: &Pubkey) -> Pubkey {
    get_associated_token_address_with_program_id(policy, mint, &TOKEN_PROGRAM_ID)
}

fn send(
    svm: &mut LiteSVM,
    payer: &Keypair,
    extra_signers: &[&Keypair],
    ix: Instruction,
) -> Result<litesvm::types::TransactionMetadata, litesvm::types::FailedTransactionMetadata> {
    let bh = svm.latest_blockhash();
    let msg = Message::new(&[ix], Some(&payer.pubkey()));
    let mut signers: Vec<&Keypair> = vec![payer];
    signers.extend_from_slice(extra_signers);
    let tx = Transaction::new(&signers, msg, bh);
    svm.send_transaction(tx)
}

// ─── Instruction builders (all data copied before &mut svm calls) ─────────────

fn ix_create_policy(
    owner: Pubkey,
    agent: Pubkey,
    mint: Pubkey,
    policy_id: u64,
    total: u64,
    cap: u64,
    expiry: u64,
) -> Instruction {
    ix_create_policy_with_controls(
        owner, agent, mint, policy_id, total, cap, expiry, 0, 0, 0, 0,
    )
}

fn ix_create_policy_with_controls(
    owner: Pubkey,
    agent: Pubkey,
    mint: Pubkey,
    policy_id: u64,
    total: u64,
    cap: u64,
    expiry: u64,
    period_budget: u64,
    period_duration_slots: u64,
    min_slot_interval: u64,
    fee_bps: u16,
) -> Instruction {
    let (policy, _) = policy_pda(&owner, policy_id);
    Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::CreatePolicy {
            policy_id,
            delegated_signer: agent,
            allowed_mint: mint,
            total_budget: total,
            per_tx_cap: cap,
            expiry_slot: expiry,
            period_budget,
            period_duration_slots,
            min_slot_interval,
            fee_bps,
            fee_recipient: owner,
        }
        .data(),
        vajra::accounts::CreatePolicy {
            owner,
            policy,
            system_program: anchor_lang::solana_program::system_program::id(),
        }
        .to_account_metas(None),
    )
}

fn ix_fund_vault(
    owner: Pubkey,
    owner_ata: Pubkey,
    policy: Pubkey,
    mint: Pubkey,
    amount: u64,
) -> Instruction {
    let vault = vault_ata(&policy, &mint);
    Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::FundVault { amount }.data(),
        vajra::accounts::FundVault {
            funder: owner,
            funder_token_account: owner_ata,
            policy,
            vault,
            allowed_mint: mint,
            token_program: TOKEN_PROGRAM_ID,
            associated_token_program: spl_associated_token_account_interface::program::ID,
            system_program: anchor_lang::solana_program::system_program::id(),
        }
        .to_account_metas(None),
    )
}

fn ix_add_destination(owner: Pubkey, policy: Pubkey, dest_ata: Pubkey) -> Instruction {
    let (dest_rule, _) = dest_rule_pda(&policy, &dest_ata);
    Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::AddDestination {}.data(),
        vajra::accounts::AddDestination {
            owner,
            policy,
            destination_token_account: dest_ata,
            destination_rule: dest_rule,
            system_program: anchor_lang::solana_program::system_program::id(),
        }
        .to_account_metas(None),
    )
}

fn ix_guarded_transfer(
    agent: Pubkey,
    policy: Pubkey,
    mint: Pubkey,
    dest_ata: Pubkey,
    amount: u64,
) -> Instruction {
    let vault = vault_ata(&policy, &mint);
    let (dest_rule, _) = dest_rule_pda(&policy, &dest_ata);
    Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::ExecuteGuardedTransfer { amount }.data(),
        vajra::accounts::ExecuteGuardedTransfer {
            delegated_signer: agent,
            policy,
            vault,
            destination_token_account: dest_ata,
            destination_rule: dest_rule,
            token_program: TOKEN_PROGRAM_ID,
        }
        .to_account_metas(None),
    )
}

fn ix_simulate_transfer(
    agent: Pubkey,
    policy: Pubkey,
    mint: Pubkey,
    dest_ata: Pubkey,
    amount: u64,
) -> Instruction {
    let vault = vault_ata(&policy, &mint);
    let (dest_rule, _) = dest_rule_pda(&policy, &dest_ata);
    Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::SimulateGuardedTransfer { amount }.data(),
        vajra::accounts::SimulateGuardedTransfer {
            delegated_signer: agent,
            policy,
            vault,
            destination_token_account: dest_ata,
            destination_rule: dest_rule,
            token_program: TOKEN_PROGRAM_ID,
        }
        .to_account_metas(None),
    )
}

fn ix_revoke(owner: Pubkey, policy: Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::RevokePolicy {}.data(),
        vajra::accounts::RevokePolicy { owner, policy }.to_account_metas(None),
    )
}

fn ix_update(
    owner: Pubkey,
    policy: Pubkey,
    new_cap: Option<u64>,
    new_expiry: Option<u64>,
    new_signer: Option<Pubkey>,
) -> Instruction {
    Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::UpdatePolicy {
            new_delegated_signer: new_signer,
            new_per_tx_cap: new_cap,
            new_expiry_slot: new_expiry,
            new_period_budget: None,
            new_period_duration_slots: None,
            new_min_slot_interval: None,
            new_fee_bps: None,
            new_fee_recipient: None,
        }
        .data(),
        vajra::accounts::UpdatePolicy { owner, policy }.to_account_metas(None),
    )
}

fn ix_withdraw(
    owner: Pubkey,
    policy: Pubkey,
    mint: Pubkey,
    destination: Pubkey,
    amount: u64,
) -> Instruction {
    let vault = vault_ata(&policy, &mint);
    Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::WithdrawFunds { amount }.data(),
        vajra::accounts::WithdrawFunds {
            owner,
            policy,
            vault,
            destination_token_account: destination,
            token_program: TOKEN_PROGRAM_ID,
        }
        .to_account_metas(None),
    )
}

// ─── Full-test fixture ────────────────────────────────────────────────────────

struct TestCtx {
    svm: LiteSVM,
    owner: Keypair,
    agent: Keypair,
    merchant_a: Keypair,
    merchant_b: Keypair,
    mint: Pubkey,
    owner_ata: Pubkey,
    merchant_a_ata: Pubkey,
    merchant_b_ata: Pubkey,
    policy: Pubkey,
    vault: Pubkey,
    policy_id: u64,
}

fn make_ctx() -> TestCtx {
    let mut svm = make_svm();
    let owner = Keypair::new();
    let agent = Keypair::new();
    let merchant_a = Keypair::new();
    let merchant_b = Keypair::new();
    airdrop(&mut svm, &owner.pubkey());
    airdrop(&mut svm, &agent.pubkey());
    airdrop(&mut svm, &merchant_a.pubkey());
    airdrop(&mut svm, &merchant_b.pubkey());

    let mint_kp = create_mint(&mut svm, &owner, &owner.pubkey(), 6);
    let mint = mint_kp.pubkey();

    let policy_id: u64 = 1;
    let (policy, _) = policy_pda(&owner.pubkey(), policy_id);
    let vault = vault_ata(&policy, &mint);

    let owner_ata =
        get_associated_token_address_with_program_id(&owner.pubkey(), &mint, &TOKEN_PROGRAM_ID);
    let merchant_a_ata = get_associated_token_address_with_program_id(
        &merchant_a.pubkey(),
        &mint,
        &TOKEN_PROGRAM_ID,
    );
    let merchant_b_ata = get_associated_token_address_with_program_id(
        &merchant_b.pubkey(),
        &mint,
        &TOKEN_PROGRAM_ID,
    );

    inject_token_account(
        &mut svm,
        &owner_ata,
        &mint,
        &owner.pubkey(),
        1_000 * 1_000_000,
    );
    inject_token_account(&mut svm, &merchant_a_ata, &mint, &merchant_a.pubkey(), 0);
    inject_token_account(&mut svm, &merchant_b_ata, &mint, &merchant_b.pubkey(), 0);
    inject_token_account(&mut svm, &vault, &mint, &policy, 0); // vault owned by PolicyPDA

    TestCtx {
        svm,
        owner,
        agent,
        merchant_a,
        merchant_b,
        mint,
        owner_ata,
        merchant_a_ata,
        merchant_b_ata,
        policy,
        vault,
        policy_id,
    }
}

// shorthand: create policy with default 100/10/far_future settings
fn setup_policy(ctx: &mut TestCtx) {
    let ix = ix_create_policy(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        100_000_000,
        10_000_000,
        999_999_999,
    );
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
}

fn setup_fund(ctx: &mut TestCtx) {
    // Reset owner ATA balance
    let owner = ctx.owner.pubkey();
    let mint = ctx.mint;
    let owner_ata = ctx.owner_ata;
    let vault = ctx.vault;
    let policy = ctx.policy;
    inject_token_account(&mut ctx.svm, &owner_ata, &mint, &owner, 200_000_000);
    inject_token_account(&mut ctx.svm, &vault, &mint, &policy, 0);
    let ix = ix_fund_vault(owner, owner_ata, policy, mint, 100_000_000);
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
}

fn setup_dest_a(ctx: &mut TestCtx) {
    let (owner, policy, dest) = (ctx.owner.pubkey(), ctx.policy, ctx.merchant_a_ata);
    let ix = ix_add_destination(owner, policy, dest);
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
}

fn do_transfer(
    ctx: &mut TestCtx,
    dest: Pubkey,
    amount: u64,
) -> Result<litesvm::types::TransactionMetadata, litesvm::types::FailedTransactionMetadata> {
    let ix = ix_guarded_transfer(ctx.agent.pubkey(), ctx.policy, ctx.mint, dest, amount);
    let bh = ctx.svm.latest_blockhash();
    let msg = Message::new(&[ix], Some(&ctx.agent.pubkey()));
    let tx = Transaction::new(&[&ctx.agent], msg, bh);
    ctx.svm.send_transaction(tx)
}

fn do_simulate(
    ctx: &mut TestCtx,
    dest: Pubkey,
    amount: u64,
) -> Result<litesvm::types::TransactionMetadata, litesvm::types::FailedTransactionMetadata> {
    let ix = ix_simulate_transfer(ctx.agent.pubkey(), ctx.policy, ctx.mint, dest, amount);
    let bh = ctx.svm.latest_blockhash();
    let msg = Message::new(&[ix], Some(&ctx.agent.pubkey()));
    let tx = Transaction::new(&[&ctx.agent], msg, bh);
    ctx.svm.send_transaction(tx)
}

fn fetch_policy(svm: &LiteSVM, policy: &Pubkey) -> vajra::state::PolicyPDA {
    let acc = svm.get_account(policy).unwrap();
    vajra::state::PolicyPDA::try_deserialize(&mut acc.data.as_slice()).unwrap()
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

#[test]
fn test_create_policy_ok() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    let acc = ctx.svm.get_account(&ctx.policy);
    assert!(acc.is_some(), "PolicyPDA should exist");
}

#[test]
fn test_create_policy_invalid_budget() {
    let mut ctx = make_ctx();
    // cap > total
    let ix = ix_create_policy(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        10_000_000,
        100_000_000,
        999_999_999,
    );
    let res = send(&mut ctx.svm, &ctx.owner, &[], ix);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("InvalidBudget")),
        "expected InvalidBudget: {:?}",
        logs
    );
}

#[test]
fn test_create_policy_zero_budget() {
    let mut ctx = make_ctx();
    let ix = ix_create_policy(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        0,
        0,
        999_999_999,
    );
    let res = send(&mut ctx.svm, &ctx.owner, &[], ix);
    assert!(res.is_err());
}

#[test]
fn test_expiry_in_past() {
    let mut ctx = make_ctx();
    let ix = ix_create_policy(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        100_000_000,
        10_000_000,
        0,
    );
    let res = send(&mut ctx.svm, &ctx.owner, &[], ix);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("ExpiryInPast")),
        "expected ExpiryInPast: {:?}",
        logs
    );
}

#[test]
fn test_fund_vault_ok() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);

    let vault_balance = get_token_amount(&ctx.svm, &ctx.vault);
    assert_eq!(
        vault_balance, 100_000_000,
        "vault balance should be 100 DemoUSD"
    );

    let vault_acc = ctx.svm.get_account(&ctx.vault).unwrap();
    let vault_data = TokenAccount::unpack(&vault_acc.data).unwrap();
    assert_eq!(
        vault_data.owner, ctx.policy,
        "vault authority must be PolicyPDA"
    );
}

#[test]
fn test_add_destination_ok() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_dest_a(&mut ctx);

    let (dest_rule, _) = dest_rule_pda(&ctx.policy, &ctx.merchant_a_ata);
    assert!(
        ctx.svm.get_account(&dest_rule).is_some(),
        "DestinationRule PDA must exist"
    );
}

#[test]
fn test_allowed_transfer_succeeds() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    let res = do_transfer(&mut ctx, dest, 5_000_000);
    assert!(res.is_ok(), "allowed transfer failed: {:?}", res.err());
}

#[test]
fn test_spent_amount_updates() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    do_transfer(&mut ctx, dest, 5_000_000).unwrap();

    let acc = ctx.svm.get_account(&ctx.policy).unwrap();
    let data: vajra::state::PolicyPDA =
        AccountDeserialize::try_deserialize(&mut acc.data.as_slice()).unwrap();
    assert_eq!(data.spent_amount, 5_000_000);
    assert_eq!(get_token_amount(&ctx.svm, &ctx.merchant_a_ata), 5_000_000);
}

#[test]
fn test_over_per_tx_cap() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    let res = do_transfer(&mut ctx, dest, 50_000_000); // > 10M cap
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("PerTxCapExceeded")),
        "expected PerTxCapExceeded: {:?}",
        logs
    );
}

#[test]
fn test_over_total_budget() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    // 9 * 10 = 90
    for _ in 0..9 {
        do_transfer(&mut ctx, dest, 10_000_000).unwrap();
    }
    // 5 more = 95 spent
    do_transfer(&mut ctx, dest, 5_000_000).unwrap();
    // 10 more = 105 > 100 budget
    let res = do_transfer(&mut ctx, dest, 10_000_000);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("TotalBudgetExceeded")),
        "expected TotalBudgetExceeded: {:?}",
        logs
    );
}

#[test]
fn test_wrong_destination_blocked() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx); // only merchant_a allowed

    let dest = ctx.merchant_b_ata; // NOT allowed
    let res = do_transfer(&mut ctx, dest, 5_000_000);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("DestinationNotAllowed")),
        "expected DestinationNotAllowed: {:?}",
        logs
    );
}

#[test]
fn test_wrong_signer_blocked() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let (agent_key, policy, mint, dest) = (
        ctx.merchant_a.pubkey(),
        ctx.policy,
        ctx.mint,
        ctx.merchant_a_ata,
    );
    // Build instruction manually with wrong signer
    let vault = vault_ata(&policy, &mint);
    let (dest_rule, _) = dest_rule_pda(&policy, &dest);
    let ix = Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::ExecuteGuardedTransfer { amount: 5_000_000 }.data(),
        vajra::accounts::ExecuteGuardedTransfer {
            delegated_signer: agent_key,
            policy,
            vault,
            destination_token_account: dest,
            destination_rule: dest_rule,
            token_program: TOKEN_PROGRAM_ID,
        }
        .to_account_metas(None),
    );
    let bh = ctx.svm.latest_blockhash();
    let msg = Message::new(&[ix], Some(&agent_key));
    let tx = Transaction::new(&[&ctx.merchant_a], msg, bh);
    let res = ctx.svm.send_transaction(tx);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("InvalidDelegateSigner")),
        "expected InvalidDelegateSigner: {:?}",
        logs
    );
}

#[test]
fn test_revoked_policy_blocks() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let (owner, policy) = (ctx.owner.pubkey(), ctx.policy);
    send(&mut ctx.svm, &ctx.owner, &[], ix_revoke(owner, policy)).unwrap();

    let dest = ctx.merchant_a_ata;
    let res = do_transfer(&mut ctx, dest, 5_000_000);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("PolicyRevoked")),
        "expected PolicyRevoked: {:?}",
        logs
    );
}

#[test]
fn test_non_owner_update_fails() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);

    let (wrong_owner, policy) = (ctx.agent.pubkey(), ctx.policy);
    let ix = ix_update(wrong_owner, policy, Some(5_000_000), None, None);
    let bh = ctx.svm.latest_blockhash();
    let msg = Message::new(&[ix], Some(&wrong_owner));
    let tx = Transaction::new(&[&ctx.agent], msg, bh);
    let res = ctx.svm.send_transaction(tx);
    assert!(res.is_err());
}

#[test]
fn test_non_owner_revoke_fails() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);

    let (wrong_owner, policy) = (ctx.agent.pubkey(), ctx.policy);
    let ix = ix_revoke(wrong_owner, policy);
    let bh = ctx.svm.latest_blockhash();
    let msg = Message::new(&[ix], Some(&wrong_owner));
    let tx = Transaction::new(&[&ctx.agent], msg, bh);
    let res = ctx.svm.send_transaction(tx);
    assert!(res.is_err());
}

#[test]
fn test_update_policy_changes_cap() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    // 15M > 10M cap: blocked
    let dest = ctx.merchant_a_ata;
    let res = do_transfer(&mut ctx, dest, 15_000_000);
    assert!(res.is_err(), "should block at 10M cap");

    // Update cap to 20M
    let (owner, policy) = (ctx.owner.pubkey(), ctx.policy);
    send(
        &mut ctx.svm,
        &ctx.owner,
        &[],
        ix_update(owner, policy, Some(20_000_000), None, None),
    )
    .unwrap();

    // Now 15M should succeed
    let res2 = do_transfer(&mut ctx, dest, 15_000_000);
    assert!(
        res2.is_ok(),
        "15M should succeed after cap raised: {:?}",
        res2.err()
    );
}

#[test]
fn test_revoke_permanently_blocks() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    // First transfer OK
    let dest = ctx.merchant_a_ata;
    do_transfer(&mut ctx, dest, 5_000_000).unwrap();

    // Revoke
    let (owner, policy) = (ctx.owner.pubkey(), ctx.policy);
    send(&mut ctx.svm, &ctx.owner, &[], ix_revoke(owner, policy)).unwrap();

    // All subsequent blocked
    assert!(do_transfer(&mut ctx, dest, 5_000_000).is_err());
    assert!(do_transfer(&mut ctx, dest, 1_000_000).is_err());
}

#[test]
fn test_add_dest_merchant_b_then_transfer_ok() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);

    // merchant_b initially blocked
    let dest_b = ctx.merchant_b_ata;
    let res = do_transfer(&mut ctx, dest_b, 5_000_000);
    assert!(res.is_err());

    // Add merchant_b as destination
    let (owner, policy) = (ctx.owner.pubkey(), ctx.policy);
    send(
        &mut ctx.svm,
        &ctx.owner,
        &[],
        ix_add_destination(owner, policy, dest_b),
    )
    .unwrap();

    // Now merchant_b transfer succeeds
    let res2 = do_transfer(&mut ctx, dest_b, 5_000_000);
    assert!(
        res2.is_ok(),
        "should succeed after add_destination: {:?}",
        res2.err()
    );
}

#[test]
fn test_raw_spl_drain_by_agent_fails() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);

    // Agent tries direct SPL transfer from vault — vault.owner = PolicyPDA, not agent
    let raw = spl_token_interface::instruction::transfer(
        &TOKEN_PROGRAM_ID,
        &ctx.vault,
        &ctx.merchant_a_ata,
        &ctx.agent.pubkey(), // claims authority but vault.owner = PolicyPDA
        &[],
        50_000_000,
    )
    .unwrap();

    let bh = ctx.svm.latest_blockhash();
    let msg = Message::new(&[raw], Some(&ctx.agent.pubkey()));
    let tx = Transaction::new(&[&ctx.agent], msg, bh);
    let res = ctx.svm.send_transaction(tx);
    assert!(
        res.is_err(),
        "raw SPL drain must fail — agent is not vault authority"
    );
}

#[test]
fn test_expired_policy_blocks_transfer() {
    let mut ctx = make_ctx();
    let ix = ix_create_policy(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        100_000_000,
        10_000_000,
        10,
    );
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    ctx.svm.warp_to_slot(11);
    let dest = ctx.merchant_a_ata;
    let res = do_transfer(&mut ctx, dest, 1_000_000);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("PolicyExpired")),
        "expected PolicyExpired: {:?}",
        logs
    );
}

#[test]
fn test_wrong_mint_destination_blocked() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let other_mint = create_mint(&mut ctx.svm, &ctx.owner, &ctx.owner.pubkey(), 6).pubkey();
    let bad_dest = get_associated_token_address_with_program_id(
        &ctx.merchant_a.pubkey(),
        &other_mint,
        &TOKEN_PROGRAM_ID,
    );
    inject_token_account(
        &mut ctx.svm,
        &bad_dest,
        &other_mint,
        &ctx.merchant_a.pubkey(),
        0,
    );
    let (dest_rule, _) = dest_rule_pda(&ctx.policy, &bad_dest);
    let ix_add = Instruction::new_with_bytes(
        vajra::id(),
        &vajra::instruction::AddDestination {}.data(),
        vajra::accounts::AddDestination {
            owner: ctx.owner.pubkey(),
            policy: ctx.policy,
            destination_token_account: bad_dest,
            destination_rule: dest_rule,
            system_program: anchor_lang::solana_program::system_program::id(),
        }
        .to_account_metas(None),
    );
    let res = send(&mut ctx.svm, &ctx.owner, &[], ix_add);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("MintMismatch")),
        "expected MintMismatch: {:?}",
        logs
    );
}

#[test]
fn test_period_budget_allows_within_period() {
    let mut ctx = make_ctx();
    let ix = ix_create_policy_with_controls(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        100_000_000,
        10_000_000,
        999_999_999,
        8_000_000,
        100,
        0,
        0,
    );
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    do_transfer(&mut ctx, dest, 3_000_000).unwrap();
    do_transfer(&mut ctx, dest, 4_000_000).unwrap();
    let policy = fetch_policy(&ctx.svm, &ctx.policy);
    assert_eq!(policy.period_spent, 7_000_000);
}

#[test]
fn test_period_budget_blocks_over_period() {
    let mut ctx = make_ctx();
    let ix = ix_create_policy_with_controls(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        100_000_000,
        10_000_000,
        999_999_999,
        8_000_000,
        100,
        0,
        0,
    );
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    do_transfer(&mut ctx, dest, 6_000_000).unwrap();
    let res = do_transfer(&mut ctx, dest, 3_000_000);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("PeriodBudgetExceeded")),
        "expected PeriodBudgetExceeded: {:?}",
        logs
    );
}

#[test]
fn test_period_reset_allows_after_duration() {
    let mut ctx = make_ctx();
    let ix = ix_create_policy_with_controls(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        100_000_000,
        10_000_000,
        999_999_999,
        8_000_000,
        5,
        0,
        0,
    );
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    do_transfer(&mut ctx, dest, 8_000_000).unwrap();
    ctx.svm.warp_to_slot(10);
    do_transfer(&mut ctx, dest, 8_000_000).unwrap();
    let policy = fetch_policy(&ctx.svm, &ctx.policy);
    assert_eq!(policy.period_spent, 8_000_000);
    assert_eq!(policy.period_start_slot, 10);
}

#[test]
fn test_velocity_blocks_repeated_quick_spend() {
    let mut ctx = make_ctx();
    let ix = ix_create_policy_with_controls(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        100_000_000,
        10_000_000,
        999_999_999,
        0,
        0,
        1_000,
        0,
    );
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);
    ctx.svm.warp_to_slot(100);

    let dest = ctx.merchant_a_ata;
    do_transfer(&mut ctx, dest, 1_000_000).unwrap();
    let res = do_transfer(&mut ctx, dest, 1_000_000);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter().any(|l| l.contains("VelocityLimitExceeded")),
        "expected VelocityLimitExceeded: {:?}",
        logs
    );
}

#[test]
fn test_velocity_allows_after_interval() {
    let mut ctx = make_ctx();
    let ix = ix_create_policy_with_controls(
        ctx.owner.pubkey(),
        ctx.agent.pubkey(),
        ctx.mint,
        ctx.policy_id,
        100_000_000,
        10_000_000,
        999_999_999,
        0,
        0,
        100,
        0,
    );
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);
    ctx.svm.warp_to_slot(100);

    let dest = ctx.merchant_a_ata;
    do_transfer(&mut ctx, dest, 1_000_000).unwrap();
    let last = fetch_policy(&ctx.svm, &ctx.policy).last_spend_slot;
    ctx.svm.warp_to_slot(last + 100);
    do_transfer(&mut ctx, dest, 1_000_000).unwrap();
}

#[test]
fn test_owner_withdrawal_succeeds() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);

    let before_owner = get_token_amount(&ctx.svm, &ctx.owner_ata);
    let ix = ix_withdraw(
        ctx.owner.pubkey(),
        ctx.policy,
        ctx.mint,
        ctx.owner_ata,
        25_000_000,
    );
    send(&mut ctx.svm, &ctx.owner, &[], ix).unwrap();
    assert_eq!(get_token_amount(&ctx.svm, &ctx.vault), 75_000_000);
    assert_eq!(
        get_token_amount(&ctx.svm, &ctx.owner_ata),
        before_owner + 25_000_000
    );
}

#[test]
fn test_withdrawal_by_non_owner_fails() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);

    let ix = ix_withdraw(
        ctx.agent.pubkey(),
        ctx.policy,
        ctx.mint,
        ctx.owner_ata,
        25_000_000,
    );
    let bh = ctx.svm.latest_blockhash();
    let msg = Message::new(&[ix], Some(&ctx.agent.pubkey()));
    let tx = Transaction::new(&[&ctx.agent], msg, bh);
    let res = ctx.svm.send_transaction(tx);
    assert!(res.is_err());
}

#[test]
fn test_withdrawal_wrong_destination_fails() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);

    let ix = ix_withdraw(
        ctx.owner.pubkey(),
        ctx.policy,
        ctx.mint,
        ctx.merchant_a_ata,
        25_000_000,
    );
    let res = send(&mut ctx.svm, &ctx.owner, &[], ix);
    assert!(res.is_err());
    let logs = res.err().unwrap().meta.logs;
    assert!(
        logs.iter()
            .any(|l| l.contains("InvalidWithdrawalDestination")),
        "expected InvalidWithdrawalDestination: {:?}",
        logs
    );
}

#[test]
fn test_simulation_pass_does_not_mutate_state() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    do_simulate(&mut ctx, dest, 5_000_000).unwrap();
    let policy = fetch_policy(&ctx.svm, &ctx.policy);
    assert_eq!(policy.spent_amount, 0);
    assert_eq!(policy.period_spent, 0);
    assert_eq!(get_token_amount(&ctx.svm, &ctx.vault), 100_000_000);
    assert_eq!(get_token_amount(&ctx.svm, &ctx.merchant_a_ata), 0);
}

#[test]
fn test_simulation_fail_does_not_mutate_state() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let dest = ctx.merchant_a_ata;
    let res = do_simulate(&mut ctx, dest, 50_000_000);
    assert!(res.is_err());
    let policy = fetch_policy(&ctx.svm, &ctx.policy);
    assert_eq!(policy.spent_amount, 0);
    assert_eq!(get_token_amount(&ctx.svm, &ctx.vault), 100_000_000);
    assert_eq!(get_token_amount(&ctx.svm, &ctx.merchant_a_ata), 0);
}

#[test]
fn test_fee_default_path_does_not_break_transfer() {
    let mut ctx = make_ctx();
    setup_policy(&mut ctx);
    setup_fund(&mut ctx);
    setup_dest_a(&mut ctx);

    let policy = fetch_policy(&ctx.svm, &ctx.policy);
    assert_eq!(policy.fee_bps, 0);

    let dest = ctx.merchant_a_ata;
    let res = do_transfer(&mut ctx, dest, 5_000_000);
    assert!(
        res.is_ok(),
        "fee default should not affect transfer: {:?}",
        res.err()
    );
}
