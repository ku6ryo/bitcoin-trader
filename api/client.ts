import axios from "axios"
import * as crypto from "crypto"
import { OrderType } from "../constants"

const API_DOMAIN = "api.bitflyer.com"
const API_BASE_PATH = `https://${API_DOMAIN}/v1`

export interface Balance {
  btc: CurrencyBalance
  jpy: CurrencyBalance
}

export interface CurrencyBalance {
  available: number
  amount: number
}

export interface Execution {
  id: number,
  orderType: OrderType,
  price: number,
  amount: number,
  date: Date,
  childOrderId: string,
  commission: number,
  childOrderAcceptanceId: string
}

export default class ApiClient {

  key: string
  secret: string

  constructor(key: string, secret: string) {
    this.key = key
    this.secret = secret
  }

  async getMidPrice() {
    const res = await axios.get(API_BASE_PATH + "/board")
    // console.log(res.data)
    return res.data.mid_price as number
  }

  async getBalance() {
    const timestamp = Date.now().toString()
    const method = "GET"
    const url = API_BASE_PATH + "/me/getbalance"
    const path = url.match(API_DOMAIN + "(/.*)")![1]
    const text = timestamp + method + path;
    const sign = crypto.createHmac("sha256", this.secret).update(text).digest("hex");
    try {
      const res = await axios.get<{ currency_code: string, amount: number, available: number }[]>(url, {
        headers: {
          "ACCESS-KEY": this.key,
          "ACCESS-TIMESTAMP": timestamp,
          "ACCESS-SIGN": sign,
          "Content-Type": "application/json"
        }
      })
      const data = res.data
      const jpy = data.find(c => c.currency_code === "JPY")
      const btc = data.find(c => c.currency_code === "BTC")
      if (!jpy) {
        throw new Error("JPY balance is not found.")
      }
      if (!btc) {
        throw new Error("BTC balance is not found.")
      }
      return {
        jpy: {
          amount: jpy.amount,
          available: jpy.available
        } as CurrencyBalance,
        btc: {
          amount: btc.amount,
          available: btc.available
        } as CurrencyBalance,
      } as Balance
    } catch(e) {
      console.log(e)
    }
  }

  async getExecutions() {
    const timestamp = Date.now().toString()
    const method = "GET"
    const url = API_BASE_PATH + "/me/getexecutions?count=1000"
    const path = url.match(API_DOMAIN + "(/.*)")![1]
    const text = timestamp + method + path;
    const sign = crypto.createHmac("sha256", this.secret).update(text).digest("hex");
    try {
      const res = await axios.get<{
        id: number,
        side: OrderType,
        price: number,
        size: number,
        exec_date: string, // ISO format
        child_order_id: string, // JOR20201203-120411-673568
        commission: number,
        child_order_acceptance_id: string // JRF20201203-120411-094851
      }[]>(url, {
        headers: {
            "ACCESS-KEY": this.key,
            "ACCESS-TIMESTAMP": timestamp,
            "ACCESS-SIGN": sign,
            "Content-Type": "application/json"
        }
      })
      return res.data.map(e => {
        return {
          id: e.id,
          orderType: e.side,
          date: new Date(e.exec_date + "Z"),
          price: e.price,
          amount: e.size,
          commission: e.commission,
          childOrderId: e.child_order_id,
          childOrderAcceptanceId: e.child_order_acceptance_id,
        } as Execution
      })
    } catch(e) {
      console.log(e)
    }
  }

  async buy(price: number, amount: number, lifetime: number) {
    var timestamp = Date.now().toString()
    var method = "POST"
    const url = API_BASE_PATH + "/me/sendchildorder"
    var path = url.match(API_DOMAIN + "(/.*)")![1]
    const body = {
      "product_code": "BTC_JPY",
      "child_order_type": "LIMIT",
      "side": "BUY",
      "price": price,
      "size": amount,
      "minute_to_expire": lifetime,
      "time_in_force": "GTC"
    }
    const stringifiedBody = JSON.stringify(body)
    var text = timestamp + method + path + stringifiedBody;
    var sign = crypto.createHmac("sha256", this.secret).update(text).digest("hex");
    const res = await axios.post(url, body, {
      headers: {
          "ACCESS-KEY": this.key,
          "ACCESS-TIMESTAMP": timestamp,
          "ACCESS-SIGN": sign,
          "Content-Type": "application/json"
      }
    })
    console.log(res.data)
  }

  async sell(price: number, amount: number, lifetime: number) {
    var timestamp = Date.now().toString()
    var method = "POST"
    const url = API_BASE_PATH + "/me/sendchildorder"
    var path = url.match(API_DOMAIN + "(/.*)")![1]
    const body = {
      "product_code": "BTC_JPY",
      "child_order_type": "LIMIT",
      "side": "SELL",
      "price": price,
      "size": amount,
      "minute_to_expire": lifetime,
      "time_in_force": "GTC"
    }
    const stringifiedBody = JSON.stringify(body)
    var text = timestamp + method + path + stringifiedBody;
    var sign = crypto.createHmac("sha256", this.secret).update(text).digest("hex");
    const res = await axios.post(url, body, {
      headers: {
          "ACCESS-KEY": this.key,
          "ACCESS-TIMESTAMP": timestamp,
          "ACCESS-SIGN": sign,
          "Content-Type": "application/json"
      }
    })
    console.log(res.data)
  }
}
