import ApiClient from "./api/client"
import SignalManger from "./SignalManger"
import delay from "delay"
import * as dotenv from "dotenv"

const signalManager = new SignalManger()

dotenv.config()
const key = process.env.KEY
const secret = process.env.SECRET
if (!key) {
  throw new Error("KEY is not given.")
}
if (!secret) {
  throw new Error("SECRET is not given.")
}

const bootTime = new Date().getTime()

;(async function () {
  await delay(2_000)
  const apiClient = new ApiClient(key, secret)
  while (true) {
    try {
      const nowDate = new Date()
      if (nowDate.getHours() === 4 && nowDate.getMinutes() < 12) {
        console.log("Market is down in 4:00 - 4:10 AM.")
        await delay(30_000)
        continue
      }
      const balance = await apiClient.getBalance()
      const price = await apiClient.getMidPrice()
      const lifetime = 5
      const avgPrice = signalManager.getAveragePrice()
      let jpyAmount = 3000
      let orderAmount = (jpyAmount / price) * (avgPrice / price)
      if (orderAmount < 0.001) {
        orderAmount = 0.001
      }
      if (jpyAmount < balance!.jpy.available) {
        console.log("BUY: " + orderAmount.toFixed(8) + " BTC")
        await apiClient.buy(price, Number(orderAmount.toFixed(8)), lifetime)
      }
    } catch (e) {
      console.error(e)
    }
    await delay(3 * 60_000)
  }
})()

;(async function () {
  const apiClient = new ApiClient(key, secret)
  await delay(2_000)
  while (true) {
    try {
      const nowDate = new Date()
      if (nowDate.getHours() === 4 && nowDate.getMinutes() < 12) {
        console.log("Market is down in 4:00 - 4:10 AM.")
        await delay(30_000)
        continue
      }
      const price = await apiClient.getMidPrice()
      const avgPurchasePrice = signalManager.getAveragePurchasePrice()
      const upliftRatio = (price - avgPurchasePrice) / avgPurchasePrice
      const balance = await apiClient.getBalance()
      if (!balance) {
        console.log("no balance")
        return
      }
      if (upliftRatio > 0.003) {
        let orderAmount = 0.001
        console.log(`SELL expected ${orderAmount}`)
        if (orderAmount > balance!.btc.available) {
          orderAmount = balance!.btc.available
        }
        console.log(`SELL actual ${orderAmount}`)
        if (orderAmount >= 0.001) {
          orderAmount *= 10_000_000
          orderAmount = Math.floor(orderAmount) / 10_000_000
          console.log("SELL: " + orderAmount.toFixed(8) + " BTC")
          try {
            await apiClient.sell(price, Number(orderAmount.toFixed(8)), 1)
          } catch (e) {
            console.error(e)
          }
        }
        await delay(20_000)
      } else {
        await delay(5_000)
      }
    } catch (e) {
      console.error(e)
      await delay(5_000)
    }
  }
})()

;(async function () {
  const apiClient = new ApiClient(key, secret)

  while (true) {
    const nowDate = new Date()
    if (nowDate.getHours() === 4 && nowDate.getMinutes() < 12) {
      console.log("Market is down in 4:00 - 4:10 AM.")
      await delay(30_000)
      continue
    }
    try {
      const balance = await apiClient.getBalance()
      signalManager.setBalance(balance!)
      const price = await apiClient.getMidPrice()
      const time = nowDate.getTime() - bootTime
      signalManager.addPricePoint(time, price)
      const avgPrice = signalManager.getAveragePrice()
      const propertyJpy = balance!.btc.amount * price + balance!.jpy.amount
      const executions = await apiClient.getExecutions()
      signalManager.setExecutions(executions!)
      const spendVelocity = signalManager.getSpendVelocity() * 60_000
      const avgPurchasePrice = signalManager.getAveragePurchasePrice()
      const upliftRatio = (price - avgPurchasePrice) / avgPurchasePrice
      const upliftJpy = (price - avgPurchasePrice) * balance!.btc.amount
      console.log("")
      console.log(`${new Date()} ================`)
      console.log("Price: " + price)
      console.log(`Market AVG Price: ${Math.round(avgPrice)} (${((price - avgPrice) / avgPrice * 100).toFixed(3)} %)`)
      console.log("Property: " + Math.round(propertyJpy) + " JPY")
      console.log(`AVG Purchase Price: ${Math.round(avgPurchasePrice)} JPY (Uplift ${Math.round(upliftJpy)} JPY / ${(upliftRatio * 100).toFixed(2)} %)`)
      console.log(`Balance JPY: ${balance!.jpy.amount} (${balance!.jpy.available}) BTC: ${balance!.btc.amount} (${balance!.btc.available})`)
      console.log(`Spend Velociy: ${Math.round(spendVelocity)} JPY / min`)
    } catch (e) {
      console.error(e)
    }
    await delay(5_000)
  }
})()
