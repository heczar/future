/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAccount } from './AccountProvider';

export default function useAccountStatus() {
  const { accountId, stripeOnboardingComplete, loading } = useAccount();

  // If no account ID exists, or the onboarding step isn't completed, onboarding is needed.
  const needsOnboarding = !accountId || !stripeOnboardingComplete;

  return {
    needsOnboarding,
    isLoading: loading,
    accountId,
    stripeOnboardingComplete
  };
}
