import { Transaction, Utxo } from '@/types/transaction'

export interface EWallet {
  keypair: any
  network: any
  address: string
}

export interface AddressInfo {
  addrStr: string
  balance: number
  balanceSat: number
  totalReceived: number
  totalReceivedSat: number
  totalSent: number
  totalSentSat: number
  unconfirmedBalance: number
  unconfirmedBalanceSat: number
  unconfirmedTxApperances: number
  txApperances: number
  transactions: string[]
}

export interface Erc20Info {
  amount: string
  address: string
  address_eth: string
  contract: {
    _id: string
    vout_idx: number
    __v: number
    block_height: number
    contract_address: string
    contract_address_base: string
    created_at: string
    decimals: string
    exception: boolean
    name: string
    symbol: string
    total_supply: string
    updated_at: string
    version: string
  }
}

export interface TokenInfo {
  contract_address: string
  total_supply: string
  decimals: string
  name: string
  symbol: string
  version: string
  transfers_count: number
  holders_count: number
}

export interface TxData {
  pagesTotal: number
  txs: Transaction[]
}

export interface SendPayload {
  to: string
  amount: number
}

export interface WalletParams {
  address: string
  keypair: any
  utxoList: Utxo[]
  fee: number
  gasLimit: number
  gasPrice: number
}
