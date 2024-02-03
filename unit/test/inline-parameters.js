import { test } from 'node:test'
import assert from 'node:assert/strict'
import inlineParameters from '../../src/plugins/inline-parameters.js'

test('inline parameters', async (t) => {
  await t.test('simple ref', () => {
    const value = 'this is the value'
    const template = {
      Parameters: {
        Name: {
          Type: 'String'
        }
      },
      Metadata: {
        expand: {
          plugins: ['@starterstack/sam-expand/plugins/parameter-overrides'],
          config: {
            parameterOverrides: [
              {
                location: './overrides.mjs',
                overrides: [
                  {
                    name: 'Name',
                    exportName: 'name'
                  }
                ]
              }
            ]
          }
        }
      },
      Resources: {
        Name: {
          Type: 'Customer::Thing',
          ServiceToken: {
            Ref: 'Name'
          }
        }
      },
      Outputs: {
        Name: {
          Value: {
            Ref: 'Name'
          }
        }
      }
    }
    const expected = structuredClone(template)
    expected.Outputs.Name.Value = value
    expected.Resources.Name.ServiceToken = value

    inlineParameters({ name: 'Name', value, template })

    assert.deepEqual(template, expected)
  })
  await t.test('simple Fn::Sub', () => {
    const value = 'this is the value'
    const template = {
      Parameters: {
        Name: {
          Type: 'String'
        }
      },
      Metadata: {
        expand: {
          plugins: ['@starterstack/sam-expand/plugins/parameter-overrides'],
          config: {
            parameterOverrides: [
              {
                location: './overrides.mjs',
                overrides: [
                  {
                    name: 'Name',
                    exportName: 'name'
                  }
                ]
              }
            ]
          }
        }
      },
      Resources: {
        Name: {
          Type: 'Customer::Thing',
          ServiceToken: {
            'Fn::Sub': 'Hello the name is ${Name}'
          }
        }
      }
    }
    const expected = structuredClone(template)
    expected.Resources.Name.ServiceToken = `Hello the name is ${value}`

    inlineParameters({ name: 'Name', value, template })

    assert.deepEqual(template, expected)
  })
  await t.test('Fn::Sub with non inline', () => {
    const value = 'this is the value'
    const template = {
      Parameters: {
        Name: {
          Type: 'String'
        },
        Stage: {
          Type: 'String'
        }
      },
      Metadata: {
        expand: {
          plugins: ['@starterstack/sam-expand/plugins/parameter-overrides'],
          config: {
            parameterOverrides: [
              {
                location: './overrides.mjs',
                overrides: [
                  {
                    name: 'Name',
                    exportName: 'name'
                  },
                  {
                    name: 'Stage',
                    exportName: 'stage'
                  }
                ]
              }
            ]
          }
        }
      },
      Resources: {
        Name: {
          Type: 'Customer::Thing',
          ServiceToken: {
            'Fn::Sub': 'Hello the name is ${Name}, and Stage is ${Stage}'
          }
        }
      }
    }
    const expected = structuredClone(template)
    expected.Resources.Name.ServiceToken['Fn::Sub'] =
      `Hello the name is ${value}, and Stage is \${Stage}`

    inlineParameters({ name: 'Name', value, template })

    assert.deepEqual(template, expected)
  })
  await t.test('Fn::Sub with single map', () => {
    const value = 'this is the value'
    const template = {
      Parameters: {
        Name: {
          Type: 'String'
        }
      },
      Metadata: {
        expand: {
          plugins: ['@starterstack/sam-expand/plugins/parameter-overrides'],
          config: {
            parameterOverrides: [
              {
                location: './overrides.mjs',
                overrides: [
                  {
                    name: 'Name',
                    exportName: 'name'
                  }
                ]
              }
            ]
          }
        }
      },
      Resources: {
        Name: {
          Type: 'Customer::Thing',
          ServiceToken: {
            'Fn::Sub': ['Hello the name is ${Name}', { Name: { Ref: 'Name' } }]
          }
        }
      }
    }
    const expected = structuredClone(template)
    expected.Resources.Name.ServiceToken['Fn::Sub'] = [
      `Hello the name is ${value}`,
      { Name: value }
    ]

    inlineParameters({ name: 'Name', value, template })

    assert.deepEqual(template, expected)
  })

  await t.test('Fn::Sub with self & map', () => {
    const value = 'this is the value ${Stage}'
    const template = {
      Parameters: {
        Name: {
          Type: 'String'
        },
        Stage: {
          Type: 'String'
        }
      },
      Metadata: {
        expand: {
          plugins: ['@starterstack/sam-expand/plugins/parameter-overrides'],
          config: {
            parameterOverrides: [
              {
                location: './overrides.mjs',
                overrides: [
                  {
                    name: 'Name',
                    exportName: 'name'
                  },
                  {
                    name: 'Stage',
                    exportName: 'stage'
                  }
                ]
              }
            ]
          }
        }
      },
      Resources: {
        Name: {
          Type: 'Customer::Thing',
          ServiceToken: {
            'Fn::Sub': [
              'Hello the name is ${Name}',
              { Stage: { Ref: 'Stage' } }
            ]
          }
        }
      }
    }
    const expected = structuredClone(template)
    expected.Resources.Name.ServiceToken['Fn::Sub'] = [
      `Hello the name is ${value}`,
      { Stage: { Ref: 'Stage' } }
    ]

    inlineParameters({ name: 'Name', value, template })

    assert.deepEqual(template, expected)
  })

  await t.test('Fn::Sub with multi map', () => {
    const value = 'this is the value'
    const template = {
      Parameters: {
        Name: {
          Type: 'String'
        },
        Stage: {
          Type: 'String'
        }
      },
      Metadata: {
        expand: {
          plugins: ['@starterstack/sam-expand/plugins/parameter-overrides'],
          config: {
            parameterOverrides: [
              {
                location: './overrides.mjs',
                overrides: [
                  {
                    name: 'Name',
                    exportName: 'name'
                  },
                  {
                    name: 'Stage',
                    exportName: 'stage'
                  }
                ]
              }
            ]
          }
        }
      },
      Resources: {
        Name: {
          Type: 'Customer::Thing',
          ServiceToken: {
            'Fn::Sub': [
              'Hello the name is ${Name} on ${Stage}',
              { Name: { Ref: 'Name' }, Stage: { Ref: 'Stage' } }
            ]
          }
        }
      }
    }
    const expected = structuredClone(template)
    expected.Resources.Name.ServiceToken['Fn::Sub'] = [
      `Hello the name is ${value} on \${Stage}`,
      { Name: value, Stage: { Ref: 'Stage' } }
    ]

    inlineParameters({ name: 'Name', value, template })

    assert.deepEqual(template, expected)
  })
})
