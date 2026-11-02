export type GivingAccount = {
  id: number
  purpose: string
  bank: string
  accountName: string
  accountNo: string
}

export const LOCAL_GIVING_ACCOUNTS: GivingAccount[] = [
  { id: 1, purpose: 'Prophetic Seeds', bank: 'Moniepoint', accountName: 'Kingsley Edet', accountNo: '8115316745' },
  { id: 2, purpose: 'Offerings, Tithes, Welfare & Projects', bank: 'Palmpay', accountName: 'Unwana Ema', accountNo: '8108287193' },
]
