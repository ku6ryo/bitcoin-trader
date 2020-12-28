import calclate from "./RegressionAnalysis"

test("Calclate with Least square method", () => {
  const points = [
    { x: 83, y: 183 },
    { x: 71, y: 168 },
    { x: 64, y: 171 },
    { x: 69, y: 178 },
    { x: 69, y: 176 },
    { x: 64, y: 172 },
    { x: 68, y: 165 },
    { x: 59, y: 158 },
    { x: 81, y: 183 },
    { x: 91, y: 182 },
    { x: 57, y: 163 },
    { x: 65, y: 175 },
    { x: 58, y: 164 },
    { x: 62, y: 175 },
  ]
  const result = calclate(points)
  expect(result.avgX.toFixed(8)).toBe("68.64285714")
  expect(result.avgY.toFixed(7)).toBe("172.3571429")
  expect(result.a.toFixed(8)).toBe("0.62329927")
  expect(result.b.toFixed(4)).toBe("129.5721")
  expect(result.r.toFixed(8)).toBe("0.78831908")
})
