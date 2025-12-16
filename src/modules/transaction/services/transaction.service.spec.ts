import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { Transaction } from '../entities/transaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TransactionType } from 'src/common/constants/enum';

describe('TransactionService', () => {
  let service: TransactionService;
  let repo: Repository<Transaction>;
  let mockManager: Partial<EntityManager>;

  const mockTransaction = {
    id: 'tx-123',
    amount: 100,
    type: TransactionType.FUND,
    idempotencyKey: 'key-123',
    wallet: { id: 'wallet-1' },
  } as Transaction;

  beforeEach(async () => {
    // Create a mock for EntityManager
    mockManager = {
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
    repo = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  describe('create', () => {
    const createDto = {
      wallet: { id: 'wallet-1' } as any,
      amount: 100,
      type: TransactionType.FUND,
      idempotencyKey: 'unique-key',
    };

    it('should return existing transaction if idempotency key is found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockTransaction);

      const result = await service.create(createDto);
      expect(result).toEqual({
        tx: mockTransaction,
        isNew: false
      });
    });

    it('should use manager repository if manager is provided', async () => {
      const managerRepo = mockManager.getRepository!(Transaction);
      (managerRepo.findOne as jest.Mock).mockResolvedValue(null);
      (managerRepo.create as jest.Mock).mockReturnValue(mockTransaction);
      (managerRepo.save as jest.Mock).mockResolvedValue(mockTransaction);

      await service.create(createDto, mockManager as EntityManager);

      expect(mockManager.getRepository).toHaveBeenCalledWith(Transaction);
      expect(managerRepo.save).toHaveBeenCalled();
      // Ensure the global repo was NOT used
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('should create and save a new transaction if key is not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);
      jest.spyOn(repo, 'create').mockReturnValue(mockTransaction);
      jest.spyOn(repo, 'save').mockResolvedValue(mockTransaction);

      const result = await service.create(createDto);

      // FIX: Expect the wrapped object
      expect(result).toEqual({
        tx: mockTransaction,
        isNew: true
      });
    });
  });

  describe('getByWallet', () => {
    it('should return transactions for a wallet', async () => {
      const txs = [mockTransaction];
      jest.spyOn(repo, 'find').mockResolvedValue(txs);

      const result = await service.getByWallet('wallet-1');

      expect(repo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { wallet: { id: 'wallet-1' } }
      }));
      expect(result).toEqual(txs);
    });

    it('should throw NotFoundException if no transactions exist', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([]);

      await expect(service.getByWallet('empty-wallet'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getById', () => {
    it('should return a transaction by ID', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(mockTransaction);

      const result = await service.getById('tx-123');

      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(null);

      await expect(service.getById('invalid-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});