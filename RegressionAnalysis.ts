export interface Point {
  x: number
  y: number
}

export default function calc(points: Point[]) {
  const n = points.length
  let sumX = 0
  let sumX2 = 0
  let sumY = 0
  let sumXY = 0
  points.forEach(p => {
    const { x, y } = p
    sumX += x
    sumX2 += x * x
    sumY += y
    sumXY += x * y
  })
  const a = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const b = (sumX2 * sumY - sumXY * sumX) / (n * sumX2 - sumX * sumX)
  const avgX = sumX / n
  const avgY = sumY / n
  const sX = Math.sqrt(points.reduce((result, p) => { result += Math.pow(p.x - avgX, 2); return result }, 0) / n)
  const sY = Math.sqrt(points.reduce((result, p) => { result += Math.pow(p.y - avgY, 2); return result }, 0) / n)
  const sXY = points.reduce((result, p) => { result += (p.x - avgX) * (p.y - avgY); return result }, 0) / n
  const r = sXY / sX / sY
  return {
    a,
    b,
    avgX,
    avgY,
    sX,
    sY,
    r,
  }
}
