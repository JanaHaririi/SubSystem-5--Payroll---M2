import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PayrollTrackingService } from './payroll-tracking.service';
import { Claim } from './models/claims.schema';
import { Dispute } from './models/disputes.schema';
import { Refund } from './models/refunds.schema';

describe('PayrollTrackingService', () => {
  let service: PayrollTrackingService;

  const execMock = jest.fn();
  const baseModelMock = {
    find: jest.fn().mockReturnThis(),
    exec: execMock,
    findByIdAndUpdate: jest.fn().mockReturnThis(),
  };

  const modelFactory = () =>
    Object.assign(jest.fn(() => ({ save: jest.fn() })), baseModelMock);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollTrackingService,
        { provide: getModelToken(Claim.name), useValue: modelFactory() },
        { provide: getModelToken(Dispute.name), useValue: modelFactory() },
        { provide: getModelToken(Refund.name), useValue: modelFactory() },
      ],
    }).compile();

    service = module.get<PayrollTrackingService>(PayrollTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
