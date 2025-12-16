import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TransactionType } from 'src/common/constants/enum';

describe('TransactionService', () => {
  let service: TransactionService;
  let transactionRepo: Repository<Transaction>;

  const mockTransactionRepo = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    transactionRepo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a transaction normally', async () => {
    const dto = { wallet: { id: '1' }, amount: 100, type: TransactionType.FUND };
    const created = { id: 't1', ...dto };

    mockTransactionRepo.create.mockReturnValue(created);
    mockTransactionRepo.save.mockResolvedValue(created);

    const result = await service.create(dto as any);
    expect(result).toEqual(created);
    expect(mockTransactionRepo.save).toHaveBeenCalledWith(created);
  });

  it('should return existing transaction if idempotencyKey exists', async () => {
    const dto = { wallet: { id: '1' }, amount: 100, type: TransactionType.FUND, idempotencyKey: 'abc123' };
    const existing = { id: 't2', ...dto };

    mockTransactionRepo.findOneBy.mockResolvedValue(existing);

    const result = await service.create(dto as any);
    expect(result).toEqual(existing);
    expect(mockTransactionRepo.create).not.toHaveBeenCalled();
  });

  it('should fetch transactions by wallet', async () => {
    const transactions = [
      { id: '1', amount: 100 },
      { id: '2', amount: 50 },
    ];
    mockTransactionRepo.find.mockResolvedValue(transactions);

    const result = await service.getByWallet('wallet1');
    expect(result).toEqual(transactions);
    expect(mockTransactionRepo.find).toHaveBeenCalledWith({
      where: { wallet: { id: 'wallet1' } },
      order: { createdAt: 'DESC' },
    });
  });

  it('should fetch transaction by ID', async () => {
    const tx = { id: 'tx1', amount: 100 };
    mockTransactionRepo.findOne.mockResolvedValue(tx);

    const result = await service.getById('tx1');
    expect(result).toEqual(tx);
    expect(mockTransactionRepo.findOne).toHaveBeenCalledWith({ where: { id: 'tx1' } });
  });

  it('should throw NotFoundException if transaction ID does not exist', async () => {
    mockTransactionRepo.findOne.mockResolvedValue(null);

    await expect(service.getById('notfound')).rejects.toThrow(
      new NotFoundException('Transaction with ID notfound not found')
    );
  });
});
