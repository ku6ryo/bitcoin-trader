import calcRegressionFactors from "./RegressionAnalysis"
import { Balance, Execution } from "./api/client"
import { OrderType } from "./constants"

interface PricePoint {
  // Timestamp in millisec
  time: number
  // Price in JPY
  price: number
}

export default class SignalManger {
  #balance: Balance | null = null
  #pricePoints: PricePoint[] = []
  #executions: Execution[] = []

  getPricePoints() {
    return JSON.parse(JSON.stringify(this.#pricePoints)) as PricePoint[]
  }

  addPricePoint(time: number, price: number) {
    if (time < 0) {
      throw new Error("Time must be 0 or a positive number.")
    }
    if (price < 0) {
      throw new Error("Price mus be 0 or a positive number.")
    }
    if (this.#pricePoints.length > 0
      && this.#pricePoints[this.#pricePoints.length - 1].time >= time) {
      throw new Error("The given time is samller than the largest timestamp in point array.")
    }
    this.#pricePoints.push({
      time,
      price
    })
  }

  getPricePointsInRange(startTime: number, endTime: number) {
    return this.#pricePoints.filter(p => p.time >= startTime && p.time <= endTime)
  }

  getVelocity(startTime: number, endTime: number) {
    const points = this.getPricePointsInRange(startTime, endTime)
    if (points.length < 2) {
      throw new Error("Needs 2 price points at least.")
    }
    const factors = calcRegressionFactors(points.map(p => { return { x: p.time / 1000, y: p.price }}))
    return factors.a / 1000
  }

  getVelocitySignals(startTime: number, endTime: number) {
    const points = this.getPricePointsInRange(startTime, endTime)
    if (points.length < 2) {
      throw new Error("Needs 2 price points at least.")
    }
    const factors = calcRegressionFactors(points.map(p => { return { x: p.time / 1000, y: p.price }}))
    return {
      velocity: factors.a / 1000,
      correlation: factors.r,
      priceStandardDeviation: factors.sY,
    }
  }

  getAveragePrice(): number {
    const points = this.#pricePoints
    if (points.length === 0) {
      throw new Error("No data points.")
    }
    const sum = points.reduce((r, p) => {
      return r + p.price
    }, 0)
    return sum / points.length
  }

  getPriceMinMax(startTime: number, endTime: number) {
    const points = this.getPricePointsInRange(startTime, endTime)
    if (points.length === 0) {
      throw new Error("No data points.")
    }
    let min = 1000_000_000
    let max = 0
    points.forEach(p => {
      if (min > p.price) min = p.price
      if (max < p.price) max = p.price
    })
    return {
      min,
      max,
    }
  }

  getBalance() {
    return this.#balance
  }

  setBalance(balance: Balance) {
    this.#balance = balance
  }

  setExecutions(executions: Execution[]) {
    this.#executions = executions
  }

  getAveragePurchasePrice(): number {
    if (!this.#balance) {
      throw new Error("Balance is not set.")
    }
    if (this.#executions.length == 0) {
      throw new Error("No executions.")
    }

    const btcAmount = this.#balance.btc.amount
    let tmpTotalJpySpent = 0
    let tmpTotalPurchasedBtc = 0
    for (let i = 0; i < this.#executions.length; i++) {
      const e = this.#executions[i]
      if (e.orderType === OrderType.SELL) {
        continue;
      }
      let amount = e.amount - e.commission
      let complete = false
      if (tmpTotalPurchasedBtc + amount > btcAmount) {
        amount = btcAmount - tmpTotalPurchasedBtc
        complete = true
      }
      tmpTotalPurchasedBtc += amount
      tmpTotalJpySpent += amount * e.price
      if (complete) {
        break;
      }
    }
    return tmpTotalJpySpent / tmpTotalPurchasedBtc
  }

  // TODO: modify to let specifying time range
  getSpendVelocity() {
    const range = 10 * 60_000
    let totalSpend = 0
    let currentTime = new Date().getTime()
    this.#executions.forEach(e => {
      if (e.orderType === OrderType.BUY && e.date.getTime() > currentTime - range) {
        totalSpend += e.amount * e.price
      }
    })
    return totalSpend / range
  }

  getSellVelocity() {
    const range = 2 * 60_000
    let totalSpend = 0
    let currentTime = new Date().getTime()
    this.#executions.forEach(e => {
      if (e.orderType === OrderType.SELL && e.date.getTime() > currentTime - range) {
        totalSpend += e.amount * e.price
      }
    })
    return totalSpend / range
  }
}
