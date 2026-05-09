/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/vajra.json`.
 */
export type Vajra = {
  address: "APn6AN7FphYAjUEJWhvGZa1T5nfQDNmCcFW2244p4UoD";
  metadata: {
    name: "vajra";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "addDestination";
      discriminator: [183, 152, 13, 93, 44, 178, 140, 243];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "policy";
        },
        {
          name: "destinationTokenAccount";
        },
        {
          name: "destinationRule";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 106, 114, 97, 95, 100, 101, 115, 116];
              },
              {
                kind: "account";
                path: "policy";
              },
              {
                kind: "account";
                path: "destinationTokenAccount";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [];
    },
    {
      name: "createPolicy";
      discriminator: [27, 81, 33, 27, 196, 103, 246, 53];
      accounts: [
        {
          name: "owner";
          writable: true;
          signer: true;
        },
        {
          name: "policy";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 97, 106, 114, 97, 95, 112, 111, 108, 105, 99, 121];
              },
              {
                kind: "account";
                path: "owner";
              },
              {
                kind: "arg";
                path: "policyId";
              },
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "policyId";
          type: "u64";
        },
        {
          name: "delegatedSigner";
          type: "pubkey";
        },
        {
          name: "allowedMint";
          type: "pubkey";
        },
        {
          name: "totalBudget";
          type: "u64";
        },
        {
          name: "perTxCap";
          type: "u64";
        },
        {
          name: "expirySlot";
          type: "u64";
        },
        {
          name: "periodBudget";
          type: "u64";
        },
        {
          name: "periodDurationSlots";
          type: "u64";
        },
        {
          name: "minSlotInterval";
          type: "u64";
        },
        {
          name: "feeBps";
          type: "u16";
        },
        {
          name: "feeRecipient";
          type: "pubkey";
        },
      ];
    },
    {
      name: "executeGuardedTransfer";
      discriminator: [164, 162, 46, 137, 233, 205, 143, 64];
      accounts: [
        {
          name: "delegatedSigner";
          signer: true;
        },
        {
          name: "policy";
          writable: true;
        },
        {
          name: "vault";
          writable: true;
        },
        {
          name: "destinationTokenAccount";
          writable: true;
        },
        {
          name: "destinationRule";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
    {
      name: "fundVault";
      discriminator: [26, 33, 207, 242, 119, 108, 134, 73];
      accounts: [
        {
          name: "funder";
          writable: true;
          signer: true;
        },
        {
          name: "funderTokenAccount";
          writable: true;
        },
        {
          name: "policy";
        },
        {
          name: "vault";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "policy";
              },
              {
                kind: "const";
                value: [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169,
                ];
              },
              {
                kind: "account";
                path: "allowedMint";
              },
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89,
              ];
            };
          };
        },
        {
          name: "allowedMint";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
        {
          name: "associatedTokenProgram";
          address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
    {
      name: "revokePolicy";
      discriminator: [49, 221, 179, 43, 154, 148, 35, 4];
      accounts: [
        {
          name: "owner";
          signer: true;
        },
        {
          name: "policy";
          writable: true;
        },
      ];
      args: [];
    },
    {
      name: "simulateGuardedTransfer";
      discriminator: [74, 205, 109, 32, 194, 5, 111, 191];
      accounts: [
        {
          name: "delegatedSigner";
          signer: true;
        },
        {
          name: "policy";
        },
        {
          name: "vault";
        },
        {
          name: "destinationTokenAccount";
        },
        {
          name: "destinationRule";
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
    {
      name: "updatePolicy";
      discriminator: [212, 245, 246, 7, 163, 151, 18, 57];
      accounts: [
        {
          name: "owner";
          signer: true;
        },
        {
          name: "policy";
          writable: true;
        },
      ];
      args: [
        {
          name: "newDelegatedSigner";
          type: {
            option: "pubkey";
          };
        },
        {
          name: "newPerTxCap";
          type: {
            option: "u64";
          };
        },
        {
          name: "newExpirySlot";
          type: {
            option: "u64";
          };
        },
        {
          name: "newPeriodBudget";
          type: {
            option: "u64";
          };
        },
        {
          name: "newPeriodDurationSlots";
          type: {
            option: "u64";
          };
        },
        {
          name: "newMinSlotInterval";
          type: {
            option: "u64";
          };
        },
        {
          name: "newFeeBps";
          type: {
            option: "u16";
          };
        },
        {
          name: "newFeeRecipient";
          type: {
            option: "pubkey";
          };
        },
      ];
    },
    {
      name: "withdrawFunds";
      discriminator: [241, 36, 29, 111, 208, 31, 104, 217];
      accounts: [
        {
          name: "owner";
          signer: true;
        },
        {
          name: "policy";
        },
        {
          name: "vault";
          writable: true;
        },
        {
          name: "destinationTokenAccount";
          writable: true;
        },
        {
          name: "tokenProgram";
          address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
        },
      ];
      args: [
        {
          name: "amount";
          type: "u64";
        },
      ];
    },
  ];
  accounts: [
    {
      name: "destinationRulePda";
      discriminator: [87, 207, 203, 246, 68, 165, 115, 232];
    },
    {
      name: "policyPda";
      discriminator: [175, 254, 106, 129, 71, 16, 104, 177];
    },
  ];
  events: [
    {
      name: "destinationAdded";
      discriminator: [231, 129, 217, 37, 0, 212, 48, 25];
    },
    {
      name: "fundsWithdrawn";
      discriminator: [56, 130, 230, 154, 35, 92, 11, 118];
    },
    {
      name: "periodReset";
      discriminator: [198, 246, 135, 48, 101, 134, 72, 246];
    },
    {
      name: "policyCreated";
      discriminator: [59, 189, 65, 121, 86, 157, 108, 10];
    },
    {
      name: "policyRevoked";
      discriminator: [237, 81, 204, 33, 25, 198, 186, 38];
    },
    {
      name: "policyUpdated";
      discriminator: [225, 112, 112, 67, 95, 236, 245, 161];
    },
    {
      name: "simulationChecked";
      discriminator: [111, 170, 25, 31, 156, 182, 110, 150];
    },
    {
      name: "spendAllowed";
      discriminator: [71, 15, 103, 157, 96, 249, 216, 97];
    },
    {
      name: "transferAllowed";
      discriminator: [20, 15, 112, 173, 98, 152, 138, 211];
    },
    {
      name: "vaultFunded";
      discriminator: [192, 119, 245, 193, 55, 223, 195, 50];
    },
    {
      name: "velocityLimitTriggered";
      discriminator: [21, 83, 254, 121, 56, 76, 241, 199];
    },
  ];
  errors: [
    {
      code: 6000;
      name: "invalidBudget";
      msg: "Budget must be > 0 and per_tx_cap must be > 0 and <= total_budget";
    },
    {
      code: 6001;
      name: "expiryInPast";
      msg: "Expiry slot must be in the future";
    },
    {
      code: 6002;
      name: "unauthorized";
      msg: "Unauthorized: caller is not the policy owner";
    },
    {
      code: 6003;
      name: "policyRevoked";
      msg: "Policy has been revoked";
    },
    {
      code: 6004;
      name: "policyExpired";
      msg: "Policy has expired";
    },
    {
      code: 6005;
      name: "invalidDelegateSigner";
      msg: "Invalid delegated signer";
    },
    {
      code: 6006;
      name: "amountZero";
      msg: "Amount must be > 0";
    },
    {
      code: 6007;
      name: "perTxCapExceeded";
      msg: "Amount exceeds per-transaction cap";
    },
    {
      code: 6008;
      name: "totalBudgetExceeded";
      msg: "Transfer would exceed total budget";
    },
    {
      code: 6009;
      name: "destinationNotAllowed";
      msg: "Destination is not on the allowlist";
    },
    {
      code: 6010;
      name: "mintMismatch";
      msg: "Token mint does not match policy allowed_mint";
    },
    {
      code: 6011;
      name: "vaultMintMismatch";
      msg: "Vault mint does not match policy allowed_mint";
    },
    {
      code: 6012;
      name: "invalidVaultAuthority";
      msg: "Vault authority is not the policy PDA";
    },
    {
      code: 6013;
      name: "vaultInsufficientBalance";
      msg: "Vault has insufficient balance";
    },
    {
      code: 6014;
      name: "arithmeticOverflow";
      msg: "Arithmetic overflow";
    },
    {
      code: 6015;
      name: "destinationAlreadyExists";
      msg: "Destination already exists in allowlist";
    },
    {
      code: 6016;
      name: "periodBudgetExceeded";
      msg: "Transfer would exceed the current period budget";
    },
    {
      code: 6017;
      name: "velocityLimitExceeded";
      msg: "Transfer violates the policy velocity limit";
    },
    {
      code: 6018;
      name: "feeBpsTooHigh";
      msg: "Fee basis points exceed the maximum allowed value";
    },
    {
      code: 6019;
      name: "invalidWithdrawalDestination";
      msg: "Withdrawal destination must be owned by the policy owner";
    },
  ];
  types: [
    {
      name: "destinationAdded";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "destination";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "destinationRulePda";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "destination";
            type: "pubkey";
          },
          {
            name: "bump";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "fundsWithdrawn";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "vault";
            type: "pubkey";
          },
          {
            name: "destination";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "periodReset";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "previousStartSlot";
            type: "u64";
          },
          {
            name: "newStartSlot";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "policyCreated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "delegatedSigner";
            type: "pubkey";
          },
          {
            name: "allowedMint";
            type: "pubkey";
          },
          {
            name: "totalBudget";
            type: "u64";
          },
          {
            name: "perTxCap";
            type: "u64";
          },
          {
            name: "expirySlot";
            type: "u64";
          },
          {
            name: "policyId";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "policyPda";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "delegatedSigner";
            type: "pubkey";
          },
          {
            name: "allowedMint";
            type: "pubkey";
          },
          {
            name: "totalBudget";
            type: "u64";
          },
          {
            name: "spentAmount";
            type: "u64";
          },
          {
            name: "perTxCap";
            type: "u64";
          },
          {
            name: "expirySlot";
            type: "u64";
          },
          {
            name: "revoked";
            type: "bool";
          },
          {
            name: "policyId";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "policyVersion";
            type: "u8";
          },
          {
            name: "periodBudget";
            type: "u64";
          },
          {
            name: "periodSpent";
            type: "u64";
          },
          {
            name: "periodStartSlot";
            type: "u64";
          },
          {
            name: "periodDurationSlots";
            type: "u64";
          },
          {
            name: "minSlotInterval";
            type: "u64";
          },
          {
            name: "lastSpendSlot";
            type: "u64";
          },
          {
            name: "feeBps";
            type: "u16";
          },
          {
            name: "feeRecipient";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "policyRevoked";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "policyUpdated";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "policyVersion";
            type: "u8";
          },
        ];
      };
    },
    {
      name: "simulationChecked";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "destination";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "wouldResetPeriod";
            type: "bool";
          },
          {
            name: "currentSlot";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "spendAllowed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "destination";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "spentAmount";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "transferAllowed";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "destination";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "spentAmount";
            type: "u64";
          },
          {
            name: "periodSpent";
            type: "u64";
          },
          {
            name: "slot";
            type: "u64";
          },
        ];
      };
    },
    {
      name: "vaultFunded";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "vault";
            type: "pubkey";
          },
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "funder";
            type: "pubkey";
          },
        ];
      };
    },
    {
      name: "velocityLimitTriggered";
      type: {
        kind: "struct";
        fields: [
          {
            name: "policy";
            type: "pubkey";
          },
          {
            name: "lastSpendSlot";
            type: "u64";
          },
          {
            name: "minSlotInterval";
            type: "u64";
          },
          {
            name: "currentSlot";
            type: "u64";
          },
        ];
      };
    },
  ];
};
