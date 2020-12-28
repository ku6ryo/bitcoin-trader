import CoinCheckClient from "./api/coincheck"
import { Side } from "./constants"
import * as dotenv from "dotenv"

dotenv.config()
const key = process.env.COINCHECK_KEY
const secret = process.env.COINCHECK_SECRET
if (!key) {
  throw new Error("KEY is not given.")
}
if (!secret) {
  throw new Error("SECRET is not given.")
}

const client = new CoinCheckClient(key, secret)

;(async () => {
  try {
    const balance = await client.getBalance()
    console.log(balance)
    const tick = await client.getTick()
    console.log(tick)
    const transactions = await client.getTransactions()
    console.log(transactions)

    const btcAmount = balance.btc.amount
    let tmpTotalJpySpent = 0
    let tmpTotalPurchasedBtc = 0
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i]
      if (t.side === Side.SELL) {
        continue;
      }
      let amount = t.funds.btc
      let complete = false
      if (tmpTotalPurchasedBtc + amount > btcAmount) {
        amount = btcAmount - tmpTotalPurchasedBtc
        complete = true
      }
      tmpTotalPurchasedBtc += amount
      tmpTotalJpySpent += amount * t.rate
      if (complete) {
        break;
      }
    }
    const avgPurchaseRate = tmpTotalJpySpent / tmpTotalPurchasedBtc
    const upliftJpy = 0
    const upliftRatio = 0
    console.log(`AVG Purchase Price: ${Math.round(avgPurchaseRate)} JPY (Uplift ${Math.round(upliftJpy)} JPY / ${(upliftRatio * 100).toFixed(2)} %)`)
  } catch(e) {
    console.log(e)
  }
})()
