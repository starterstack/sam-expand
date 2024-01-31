/**
 * @param {string} value
 * @returns {Boolean}
 */
export default function shouldInlineParameterValue(value) {
  return String(value).length > 4096 || /[\n\r"']/.test(String(value))
}
