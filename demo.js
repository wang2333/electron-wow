const { performance } = require('perf_hooks')

function fibonacci(n) {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

const n = 45 // 计算斐波那契数列的第40项
const start = performance.now()
const result = fibonacci(n)
const end = performance.now()

console.log(`Fibonacci(${n}): ${result}`)
console.log(`Execution time: ${(end - start).toFixed(2)} ms`)
