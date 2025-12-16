import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { TransactionService } from 'src/modules/transaction/services/transaction.service';
import { DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Currency, TransactionType } from 'src/common/constants/enum';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CurrencyConverter } from 'src/common/util/currencyConversion.util';

describe('WalletService', () => {
  let service: WalletService;
  let mockWalletRepo: any;
  let mockTransactionService: any;
  let mockDataSource: any;
  let mockManager: any;

  beforeEach(async () => {
    // Mock for the EntityManager used inside transactions
    mockManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      getRepository: jest.fn().mockReturnThis(),
    };

    mockWalletRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    mockTransactionService = {
      create: jest.fn(),
    };

    mockDataSource = {
      // Automatically execute the callback passed to .transaction()
      transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: mockWalletRepo },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  describe('fundWallet', () => {
    const fundDto = { amount: 10000, idempotencyKey: 'test-key' }; // 100 USD in cents

    it('should fund a wallet successfully if transaction is new', async () => {
      const wallet = { id: '1', balance: 5000, currency: Currency.USD };
      
      // Simulate that this IS a new transaction (not a duplicate)
      mockTransactionService.create.mockResolvedValue({ isNew: true });
      mockManager.findOne.mockResolvedValue(wallet);
      mockManager.save.mockResolvedValue({ ...wallet, balance: 15000 });

      const result = await service.fundWallet('1', fundDto);

      expect(mockTransactionService.create).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'test-key' }),
        mockManager
      );
      expect(mockManager.findOne).toHaveBeenCalledWith(Wallet, expect.objectContaining({
        lock: { mode: 'pessimistic_write' }
      }));
      expect(wallet.balance).toBe(15000);
      expect(result.balance).toBe(150); // Converted back to USD
    });

    it('should skip funding if transaction already exists (idempotency)', async () => {
      const wallet = { id: '1', balance: 5000, currency: Currency.USD };
      
      // Simulate existing transaction
      mockTransactionService.create.mockResolvedValue({ isNew: false });
      mockManager.findOne.mockResolvedValue(wallet);

      await service.fundWallet('1', fundDto);

      // Should NOT update the balance
      expect(wallet.balance).toBe(5000);
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequest if amount is zero or negative', async () => {
      await expect(service.fundWallet('1', { amount: 0, idempotencyKey: 'k' }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('transferFunds', () => {
    it('should transfer funds and lock both wallets in order', async () => {
      const sender = { id: 's', balance: 20000 };
      const receiver = { id: 'r', balance: 5000 };
      
      // manager.find is used for locking both
      mockManager.find.mockResolvedValue([sender, receiver]);
      mockTransactionService.create.mockResolvedValue({ isNew: true });

      const result = await service.transferFunds('s', 'r', 10000, 'tx-key');

      expect(sender.balance).toBe(10000);
      expect(receiver.balance).toBe(15000);
      expect(mockManager.save).toHaveBeenCalledWith([sender, receiver]);
      
      // Check that two logs were created with suffixed keys
      expect(mockTransactionService.create).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'tx-key-out' }),
        mockManager
      );
      expect(mockTransactionService.create).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: 'tx-key-in' }),
        mockManager
      );
    });

    it('should throw ConflictException if sender has insufficient funds', async () => {
      const sender = { id: 's', balance: 1000 };
      const receiver = { id: 'r', balance: 5000 };
      mockManager.find.mockResolvedValue([sender, receiver]);

      await expect(service.transferFunds('s', 'r', 5000, 'key'))
        .rejects.toThrow(ConflictException);
    });

    it('should throw BadRequest if sender and receiver are the same', async () => {
      await expect(service.transferFunds('s', 's', 100, 'key'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getWalletDetails', () => {
    it('should return wallet with USD balance', async () => {
      const wallet = { id: '1', balance: 10000, transactions: [] };
      mockWalletRepo.findOne.mockResolvedValue(wallet);

      const result = await service.getWalletDetails('1');

      expect(result.balance).toBe(100);
      expect(result.transactions).toEqual([]);
    });

    it('should throw NotFound if wallet does not exist', async () => {
      mockWalletRepo.findOne.mockResolvedValue(null);
      await expect(service.getWalletDetails('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});