import {
  JobStatus,
  UserRole,
  type IJobEntity,
  type IJobView,
} from '@kaamsetu/types';
import { serviceCategoryRepository } from '../service-categories/service-category.repository.js';
import { customerProfileRepository } from '../customer-profiles/customer-profile.repository.js';
import { workerProfileRepository } from '../worker-profiles/worker-profile.repository.js';
import { userRepository } from '../users/user.repository.js';

const ASSIGNED_STATES = new Set<JobStatus>([
  JobStatus.ACCEPTED,
  JobStatus.EN_ROUTE,
  JobStatus.ARRIVED,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.DISPUTED,
]);

export class JobViewService {
  async toView(job: IJobEntity, actor: { id: string; role: UserRole }): Promise<IJobView> {
    const workerUserId = job.assignedWorkerId ?? null;
    const [category, customerProfile, customerUser, workerProfile, workerUser] = await Promise.all([
      serviceCategoryRepository.findById(job.categoryId),
      customerProfileRepository.findByUserId(job.customerId),
      userRepository.findById(job.customerId),
      workerUserId ? workerProfileRepository.findByUserId(workerUserId) : Promise.resolve(null),
      workerUserId ? userRepository.findById(workerUserId) : Promise.resolve(null),
    ]);

    const actorIsAssignedWorker = actor.role === UserRole.WORKER && actor.id === workerUserId;
    const actorIsCustomer = actor.role === UserRole.CUSTOMER && actor.id === job.customerId;
    const actorIsStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.SUPPORT;
    const maySeeContact = ASSIGNED_STATES.has(job.status);

    return {
      ...job,
      category: {
        id: category?.id ?? job.categoryId,
        name: category?.name ?? 'Service',
        slug: category?.slug ?? '',
      },
      customer: {
        id: job.customerId,
        displayName: customerProfile?.displayName ?? 'Customer',
        ...((actorIsAssignedWorker || actorIsStaff) && maySeeContact && customerUser
          ? { phoneNumber: customerUser.phoneNumber }
          : {}),
      },
      assignedWorker: workerProfile
        ? {
            id: workerProfile.userId,
            displayName: workerProfile.displayName,
            ...((actorIsCustomer || actorIsStaff) && maySeeContact && workerUser
              ? { phoneNumber: workerUser.phoneNumber }
              : {}),
            profilePhotoUrl: workerUser?.profilePhotoUrl ?? null,
            rating: workerProfile.rating,
            skills: workerProfile.skills.map((skill) => skill.skillName ?? skill.skillId),
            verificationStatus: workerProfile.verificationStatus,
          }
        : null,
    };
  }

  toViews(jobs: IJobEntity[], actor: { id: string; role: UserRole }): Promise<IJobView[]> {
    return Promise.all(jobs.map((job) => this.toView(job, actor)));
  }
}

export const jobViewService = new JobViewService();
