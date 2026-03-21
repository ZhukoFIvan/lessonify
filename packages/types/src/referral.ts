export interface ReferralUser {
  id: string
  name: string
  createdAt: string
}

export interface ReferralEarning {
  id: string
  earnAmount: number
  purchaseAmount: number
  description: string | null
  paid: boolean
  createdAt: string
}

export interface ReferralStats {
  referralCode: string | null
  referralLink: string | null
  referralsCount: number
  referrals: ReferralUser[]
  totalEarned: number
  paidOut: number
  availableBalance: number
  earnings: ReferralEarning[]
  canWithdraw: boolean
  hasPendingRequest: boolean
  minWithdrawal: number
}
