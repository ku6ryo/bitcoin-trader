import * as csv from 'csv-parser'
import * as fs from 'fs'

interface Point {
  timestamp: number
  date: Date
  open: number
  high: number
  low: number
  close: number
}

async function fetchData(): Promise<Point[]> {
  return new Promise((resolve, reject) => {
    const points: Point[] = [];
    fs.createReadStream('Coinbase_BTCUSD_minute.csv')
      .pipe(csv())
      .on('data', (data) => {
        const timestamp = Number(data._1) * 1000
        if (Number.isNaN(timestamp)) {
          return
        }
        const date = new Date(timestamp)
        const open = Number(data._4)
        const high = Number(data._5)
        const low = Number(data._6)
        const close = Number(data._7)
        points.push({
          timestamp,
          date,
          open,
          high,
          low,
          close
        })
      })
      .on('end', () => {
        resolve(points)
      });
  })
}

function getRange(points: Point[], start: Date, end: Date) {
  return points.filter((p) => {
    return p.timestamp >= start.getTime() && p.timestamp <= end.getTime()
  }).sort((a, b) => {
    return a.timestamp - b.timestamp
  })
}

;(async function () {
  const points = await fetchData()
  const targetPoints = getRange(points, new Date(2020, 11, 1), new Date(2020, 11, 2, 12))
  console.log(targetPoints)
  const unit = 0.001
  const upliftThreshold = 0.002
  const minUnit = 0.001
  let totalSpent = 0
  let totalSell = 0
  let btcAmount = 0
  let avgPurchasePrice = 0
  targetPoints.forEach(p => {
    if (p.date.getMinutes() % 1 === 0) {
      if ((p.open - avgPurchasePrice) / avgPurchasePrice > upliftThreshold) {
        const sellAmount = unit
        const sellUsd = sellAmount * p.open
        if (btcAmount >= minUnit && btcAmount > sellAmount) {
          avgPurchasePrice = (avgPurchasePrice * btcAmount - sellUsd) / (btcAmount - sellAmount)
          totalSell += sellUsd
          btcAmount -= sellAmount
          console.log("sell: " + sellUsd)
        }
      }
    }
    if (p.date.getMinutes() % 15 === 0) {
      const orderUsd = 20 //p.open * orderAmount
      const buyAmount = orderUsd / p.open
      avgPurchasePrice = (avgPurchasePrice * btcAmount + orderUsd) / (btcAmount + buyAmount)
      totalSpent += orderUsd
      btcAmount += buyAmount
      console.log("buy: " + buyAmount)
    }
    console.log(p.date)
    console.log(p.open)
    console.log(avgPurchasePrice)
    console.log(btcAmount)
  })
  console.log("==== Result ====")
  console.log(avgPurchasePrice)
  console.log(totalSpent)
  console.log(totalSell)
  console.log(btcAmount)
  const upliftRatio = totalSell / (totalSpent - btcAmount * avgPurchasePrice) * 100
  console.log(upliftRatio.toFixed() + " %")
})()
