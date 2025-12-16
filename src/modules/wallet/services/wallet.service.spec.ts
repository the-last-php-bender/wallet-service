import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { TransactionService } from 'src/modules/transaction/services/transaction.service';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Currency, TransactionType } from 'src/common/constants/enum';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CurrencyConverter } from 'src/common/util/currencyConversion.util';

describe('WalletService', () => {
  let service: WalletService;
  let mockWalletRepo: any;
  let mockTransactionService: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockWalletRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    mockTransactionService = {
      create: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn(),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a wallet', async () => {
    const wallet = { id: '1', balance: 0, currency: Currency.USD };
    mockWalletRepo.create.mockReturnValue(wallet);
    mockWalletRepo.save.mockResolvedValue(wallet);

    const result = await service.createWallet();

    expect(mockWalletRepo.create).toHaveBeenCalledWith({ balance: 0, currency: Currency.USD });
    expect(result).toEqual(wallet);
  });

  it('should fund a wallet', async () => {
    const wallet = { id: '1', balance: 0, currency: Currency.USD };
    mockWalletRepo.findOne.mockResolvedValue(wallet);
    mockWalletRepo.save.mockResolvedValue({ ...wallet, balance: 10000 }); // 100 USD in cents
    mockTransactionService.create.mockResolvedValue({});

    const result = await service.fundWallet('1', 10000);

    expect(result.balance).toBe(10000);
    expect(mockTransactionService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        wallet,
        amount: CurrencyConverter.centsToUsd(10000),
        type: TransactionType.FUND,
      }),
    );
  });

  it('should throw if funding negative amount', async () => {
    await expect(service.fundWallet('1', -50)).rejects.toThrow(BadRequestException);
  });

  it('should transfer funds successfully', async () => {
    const sender = { id: 's', balance: 20000, currency: Currency.USD }; // 200 USD
    const receiver = { id: 'r', balance: 5000, currency: Currency.USD }; // 50 USD

    const saveMock = jest.fn();

    mockDataSource.transaction.mockImplementation(async (cb: any ) =>
      cb({
        findOne: async (_entity: any, opts: any) => {
          if (opts.where.id === 's') return sender;
          if (opts.where.id === 'r') return receiver;
          return null;
        },
        save: saveMock,
      }),
    );

    mockTransactionService.create.mockResolvedValue({});

    const result = await service.transferFunds('s', 'r', 10000); // 100 USD in cents

    expect(result.sender.balance).toBe(sender.balance);
    expect(result.receiver.balance).toBe(receiver.balance);
    expect(mockTransactionService.create).toHaveBeenCalledTimes(2);
    expect(saveMock).toHaveBeenCalledTimes(2);
  });

  it('should throw if sender has insufficient balance', async () => {
    const sender = { id: 's', balance: 5000, currency: Currency.USD };
    const receiver = { id: 'r', balance: 5000, currency: Currency.USD };

    mockDataSource.transaction.mockImplementation(async (cb:any) =>
      cb({
        findOne: async (_entity: any, opts: any) => {
          if (opts.where.id === 's') return sender;
          if (opts.where.id === 'r') return receiver;
          return null;
        },
        save: jest.fn(),
      }),
    );

    await expect(service.transferFunds('s', 'r', 10000)).rejects.toThrow(ConflictException);
  });
});
