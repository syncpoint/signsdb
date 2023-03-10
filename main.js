#!/usr/bin/env node
import * as R from 'ramda'

// standards:
// legacy - app6b, ms2525b, ms2525c,
// current - app6d, ms2525d
import app6 from "stanag-app6"
import ms2525 from "mil-std-2525"

const entries = Object.entries
const keys = Object.keys
const values = Object.values
const fromEntries = Object.fromEntries

const splitStandard = standard => standard.startsWith('app')
  ? `APP+${standard.match(/^app6(.*)$/)[1].toUpperCase()}`
  : `2525+${standard.match(/^ms2525(.*)$/)[1].toUpperCase()}`

const collectLegacySymbols = context => input => {
  const { standard, ...rest } = context
  const { codingscheme, battledimension, functionid } = input
  const sidc = `${codingscheme}-${battledimension}-${functionid}`
  const key = `symbol:${sidc}+${splitStandard(standard)}`
  const value = {
    ...rest,
    hierarchy: input.hierarchy.trim(),
    names: input.names.filter(Boolean),
  }

  return [key, value]
}

const collectDimension = context => input => {
  const { name: dimension, mainIcon } = input
  const collect = collectLegacySymbols({ ...context, dimension })

  return Array.isArray(input)
    ? input.map(collect)
    : mainIcon.map(collect)
}

const collectScheme = context => input => {
  const { name: scheme, ...rest } = input
  const collect = collectDimension({ ...context, scheme })
  return values(rest).flatMap(collect)
}

const collectLegacy = (context, input) => {
  const collect = collectScheme(context)
  return values(input).flatMap(collect)
}

const collectEntity = context => input => {
  const sidc = `10**${context.set}****${input.Code}****`
  const key = `symbol:${sidc}+${splitStandard(context.standard)}`
  const value = {
    dimension: context.name,
    entity: input.Entity,
    type: input['Entity Type'],
    subtype: input['Entity Subtype']
  }

  return [key, value]
}

const collectModifier = context => input => {
  const name = input['First Modifier'] || input['Second Modifier']
  const category = input.Category
  const dimension = context.name
  const code = context.position === 0 ? input.Code + '--' : '--' + input.Code
  const key = `modifier:${context.set}/${code}+${splitStandard(context.standard)}`
  const value = { dimension, name, category }
  return [key, value]
}


const collectSet = context => input => {
  const { name, symbolset: set, mainIcon, modifier1, modifier2 } = input
  const validCode = ({ Code }) => Number(Code) || Code === '00'
  return [
    ...mainIcon.map(collectEntity({ ...context, set, name })),
    ...modifier1.filter(validCode).map(collectModifier({ ...context, set, name, position: 0 })),
    ...modifier2.filter(validCode).map(collectModifier({ ...context, set, name, position: 1 }))
  ]
}


const collectCurrent = (context, input) => {
  const collect = collectSet(context)
  return values(input).flatMap(collect)
}

const collectSymbols = input => entries(input).flatMap(([standard, value]) => {
  // Either map legacy ('WAR' is a value key) or current ('10' is a value key)
  return value.WAR
    ? collectLegacy({ standard }, value)
    : collectCurrent({ standard }, value)
})

const symbols = collectSymbols({ ...ms2525 }).filter(Boolean)
console.log(JSON.stringify(fromEntries(symbols), null, 2))
