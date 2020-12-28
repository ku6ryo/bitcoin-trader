import {
  CoinCheck,
  Balance as CoinCheckBalance,
  Tick as CoinCheckTick,
} from "coincheck"
import { Side } from "../constants"

export interface Balance {
  btc: CurrencyBalance
  jpy: CurrencyBalance
}

export interface Tick {
  last: number,
  bid: number,
  ask: number,
  high: number,
  low: number,
  volume: number,
  timestamp: number,
}

export interface Transaction {
  id: number,
  orderId: number,
  createdAt: string,
  funds: {
    btc: number,
    jpy: number,
  },
  pair: string,
  rate: number,
  fee: number,
  liquidity: string,
  side: Side,
}

export interface CurrencyBalance {
  available: number
  amount: number
}

export default class ApiClient {

  client: CoinCheck

  constructor(key: string, secret: string) {
    this.client = new CoinCheck(key, secret)
  }

  async getBalance(): Promise<Balance> {
    return new Promise((resolve, reject) => {
      const params = {
        options: {
          success: function(data: string) {
            const parsed = JSON.parse(data) as CoinCheckBalance
            const jpy = Number(parsed.jpy)
            const jpyReserved = Number(parsed.jpy_reserved)
            const btc = Number(parsed.btc)
            const btcReserved = Number(parsed.btc_reserved)
            const balance = {
              jpy: {
                amount: jpy,
                available: jpy - jpyReserved,
              },
              btc: {
                amount: btc,
                available: btc - btcReserved,
              },
            } as Balance
            resolve(balance)
          },
          error: function(error: Error) {
            reject(error)
          }
        }
      }
      this.client.account.balance(params)
    })
  }

  async getTick(): Promise<Tick> {
    return new Promise((resolve, reject) => {
      const params = {
        options: {
          success: function(data: string) {
            const parsed = JSON.parse(data) as CoinCheckTick
            resolve(parsed as Tick)
          },
          error: function(error: Error) {
            reject(error)
          }
        }
      }
      this.client.ticker.all(params)
    })
  }

  async getTransactionsInternal(after: number | null): Promise<Transaction[]> {
    let data: any = {
      limit: 25,
      order: "desc",
    }
    if (after) {
      data.starting_after = after
    }
    return new Promise((resolve, reject) => {
      const params = {
        data,
        options: {
          success: function(data: string) {
            const parsed = JSON.parse(data)
            const rawTransactions = parsed.data
            resolve(rawTransactions.map((raw: any) => {
              return {
                id: raw.id,
                orderId: raw.order_id,
                createdAt: raw.created_at,
                funds: {
                  btc: Number(raw.funds.btc),
                  jpy: Number(raw.funds.jpy),
                },
                pair: raw.pair,
                rate: Number(raw.rate),
                fee: Number(raw.fee),
                liquidity: raw.liquidity,
                side: raw.side as Side,
              } as Transaction
            }))
          },
          error: function(error: Error) {
            reject(error)
          }
        },
      }
      this.client.order.transactionsPagination(params)
    })
  }

  async getTransactions(limit = 100) {
    const unit = 25
    const maxIterations = Math.ceil(limit / unit)
    let transactions: Transaction[] = []
    let after: null | number = null
    for (let i = 0; i < maxIterations; i++) {
      const ts: Transaction[] = await this.getTransactionsInternal(after)
      if (ts.length > 0) {
        transactions = transactions.concat(ts)
        after = ts[ts.length - 1].id
        console.log(after)
      } else {
        break
      }
    }
    return transactions
  }
}
