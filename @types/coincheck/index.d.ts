declare module "coincheck" {
  export interface Balance {
    jpy: string
    jpy_reserved: string
    btc: string
    btc_reserved: string
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
  export class CoinCheck {
    constructor(accessKey: string, secretKey: string);
    account: Account;
    ticker: Ticker;
    order: Order;
  }
  export class Account {
    constructor(coinCheck: CoinCheck);
    balance(params: any): Promise<void>
  }
  export class Ticker {
    constructor(coinCheck: CoinCheck);
    all(params: any): Promise<void>
  }
  export class Order {
    constructor(coinCheck: CoinCheck);
    transactions(params: any): Promise<void>
    transactionsPagination(params: any): Promise<void>
  }
}
