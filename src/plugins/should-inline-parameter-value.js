/**
 * @param {string} value
 * @returns {Boolean}
 */
export default function shouldInlineParameterValue(value) {
  return String(value).length > 4096 || /[\s"']/.test(String(value))
}
