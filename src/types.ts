/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SPEPhase {
  INVESTIGATION = 'investigation',
  STRATEGY = 'strategy',
  EXECUTION = 'execution',
  OPTIMIZATION = 'optimization',
  SCALING = 'scaling'
}


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export interface ProjectContext {
  id: string;
  name: string;
  description: string;
  logos: string[]; // Base64 or URLs
  trainingMaterial?: string[]; // Base64 or URLs
  driveContext?: { name: string; content: string }[];
  methodology: 'SPE' | 'DE' | 'Custom';
  brandGuidelines?: {
    primaryColor: string;
    secondaryColor: string;
    tone: string;
  };
}

export interface UserProfile {
  name: string;
  roles: string[];
  bio: string;
  philosophy: string;
  projects: string[];
  credits?: number;
  isPremium?: boolean;
  email?: string;
  membershipMonths?: number;
  membershipExpiresAt?: string | null;
  pagoMovilRequest?: {
    bank: string;
    phone: string;
    id: string;
    reference: string;
    amountUsd: number;
    amountBs: number;
    timestamp: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
    rejectedAt?: string;
    paymentType?: 'pago_movil' | 'binance_eth' | 'paypal' | 'transferencia';
  } | null;
  openwaConfig?: {
    webhookUrl: string;
    apiHost: string;
    apiPort: number;
    sessionName: string;
    isEnabled: boolean;
    aiResponderEnabled: boolean;
    aiPromptRules: string;
    triggerKeywords: { id: string; keyword: string; response: string }[];
  };
}

export interface GeneratedContent {
  id: string;
  type: 'infographic' | 'flyer' | 'photo' | 'social_post';
  title: string;
  description: string;
  imageUrl: string;
  createdAt: number;
  metadata: {
    prompt: string;
    phase?: SPEPhase;
  };
}
