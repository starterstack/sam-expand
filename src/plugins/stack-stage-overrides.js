// @ts-check

import path from 'node:path'

/** @type {import('./types.js').Lifecycles} */
export const lifecycles = ['pre:deploy', 'pre:package']

/** @type {import('./types.js').PluginSchema<{ region?: string, 'suffix-stage': boolean, 'config-env'?: string, stage?: string }>} */
export const schema = {
  type: 'object',
  properties: {
    region: {
      type: 'string',
      nullable: true
    },
    stage: {
      type: 'string',
      nullable: true
    },
    'config-env': {
      type: 'string',
      nullable: true
    },
    'suffix-stage': {
      type: 'boolean'
    }
  },
  required: ['suffix-stage'],
  additionalProperties: false
}

export const metadataConfig = 'stack-stage-overrides'

/** @type {import('./types.js').Plugin} */
export const lifecycle = async function expand({
  template,
  templateDirectory,
  log,
  argv,
  lifecycle
}) {
  const config = template.Metadata.expand.config?.['stack-stage-overrides']
  if (lifecycle === 'pre:deploy' || lifecycle === 'pre:package') {
    log('original argv %O', argv)
    if (config.region) {
      const regionIndex = argv.indexOf('--region')
      if (regionIndex !== -1) {
        argv.splice(regionIndex, 2)
      }
      argv.push(...['--region', config.region])
    }
    if (config['config-env']) {
      const configIndex = argv.indexOf('--config-env')
      if (configIndex !== -1) {
        argv.splice(configIndex, 2)
      }
      argv.push(...['--config-env', config['config-env']])
    }
  }
  if (lifecycle === 'pre:deploy') {
    const stackParameter = argv.find((x) => x?.startsWith('Stack='))
    if (config['stage']) {
      const stageParameterIndex = argv.findIndex((x) => x?.startsWith('Stage='))
      if (stageParameterIndex === -1) {
        throw new Error(
          'suffix-stage only works with --parameter-overrides "Stage="'
        )
      }
      argv[stageParameterIndex] = `Stage=${config['stage']}`
    }
    let stackName
    const stackNameIndex = argv.indexOf('--stack-name')
    if (stackNameIndex === -1) {
      if (stackParameter) {
        stackName = `${stackParameter.slice('Stack='.length)}-${path.basename(
          templateDirectory
        )}`
      } else {
        if (config['suffix-stage']) {
          throw new Error(
            'suffix-stage only works with both --parameter-overrides "Stage=" and (--stack-name or "Stack=")'
          )
        }
      }
    } else {
      stackName = argv[stackNameIndex + 1]
      argv.splice(stackNameIndex, 2)
    }
    if (stackName) {
      if (config['suffix-stage']) {
        const stageParameter = argv.find((x) => x?.startsWith('Stage='))
        if (!stageParameter) {
          throw new Error(
            'suffix-stage only works with --parameter-overrides "Stage="'
          )
        }
        argv.push(
          ...[
            '--stack-name',
            `${stackName}-${stageParameter.slice('Stage='.length)}`
          ]
        )
      } else {
        argv.push(...['--stack-name', stackName])
      }
    }
    if (stackParameter) {
      const tagsIndex = argv.indexOf('--tags')
      const tagArguments = [
        '--tags',
        `ManagedBy=${stackParameter.slice('Stack='.length)}`
      ]
      if (tagsIndex === -1) {
        argv.push(...tagArguments)
      } else if (!argv.find((x) => x?.startsWith('ManagedBy='))) {
        argv.splice(tagsIndex, 1, ...tagArguments)
      }
    }
  }
}
