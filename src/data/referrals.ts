import { ReferralUser } from '../types';

// The referral and network programme has no backend yet (see plan.md, "Out-of-proposal items").
// These rows are illustrative preview data for the Network tab only and are NOT part of the
// participant's real balances or history.
export const REFERRAL_PREVIEW_BONUS = 88.4;

export const REFERRAL_PREVIEW: ReferralUser[] = [
  { id: 'ref-1', username: 'elena_cryptoview', level: 1, joinedDate: 'Sep 02, 2026', tier: 'Growth', tasksCompletedToday: 26, commissionGenerated: 24.8, status: 'active' },
  { id: 'ref-2', username: 'marcus_alpha_node', level: 1, joinedDate: 'Sep 05, 2026', tier: 'Pro', tasksCompletedToday: 55, commissionGenerated: 42.1, status: 'active' },
  { id: 'ref-3', username: 'david_defi_hunter', level: 1, joinedDate: 'Sep 09, 2026', tier: 'Starter', tasksCompletedToday: 12, commissionGenerated: 6.4, status: 'active' },
  { id: 'ref-4', username: 'sarah_web3_design', level: 2, joinedDate: 'Sep 11, 2026', tier: 'Growth', tasksCompletedToday: 20, commissionGenerated: 9.6, status: 'active' },
  { id: 'ref-5', username: 'alex_trader_99', level: 2, joinedDate: 'Sep 12, 2026', tier: 'Starter', tasksCompletedToday: 10, commissionGenerated: 3.2, status: 'active' },
  { id: 'ref-6', username: 'kevin_quant_node', level: 3, joinedDate: 'Sep 15, 2026', tier: 'Growth', tasksCompletedToday: 18, commissionGenerated: 2.3, status: 'active' },
];
