/** These extensions should be globally available */
Number.prototype.toFixedDecimal = function (this: number, decimalsToRight: number = 2) {
  if (this === 0) return this.toString();
  const isNegative = this < 0;
  let inputCopy1 = this * (isNegative ? -1 : 1);
  let numDecimals = 0;
  while (inputCopy1 < 1) {
    numDecimals++;
    inputCopy1 = inputCopy1 * 10;
  }
  return this.toFixed(numDecimals + decimalsToRight)
}

// make this a module
export {};