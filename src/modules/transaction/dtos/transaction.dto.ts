import { TransactionType } from "src/common/constants/enum";
import { Wallet } from "src/modules/wallet/entities/wallet.entity";

interface CreateTransactionDto {
  wallet: Wallet;
  amount: number;
  type: TransactionType;
  relatedWalletId?: string;
  idempotencyKey?: string;
}
export { CreateTransactionDto };