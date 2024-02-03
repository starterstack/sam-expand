/** * @param {{ name: string, value: string, template: any }} options
 * @returns {void}
 **/

const PLACE_HOLDER = /\${[^}]+}/

export default function inlineParameters({ name, value, template }) {
  /**
   * @param {any} node
   * @return {void}
   */
  function walk(node) {
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item)
      }
    }
    if (node && typeof node === 'object') {
      for (const [key, item] of Object.entries(node)) {
        if (item?.Ref === name) {
          node[key] = value
        } else if (item?.['Fn::Sub']) {
          const sub = item['Fn::Sub']
          const [format, map] = Array.isArray(sub) ? sub : [sub]
          if (map) {
            item['Fn::Sub'][0] = format.replaceAll(`\${${name}}`, value)
            if (map[name]) {
              map[name] = value
            }
          } else {
            item['Fn::Sub'] = format.replaceAll(`\${${name}}`, value)
            if (!PLACE_HOLDER.test(item['Fn::Sub'])) {
              node[key] = item['Fn::Sub']
            }
          }
        } else {
          walk(item)
        }
      }
    }
  }
  walk(template)
}
