#!/usr/bin/env node
import fs from 'fs'
import * as R from 'ramda'

/*
[
    'S*APWMAA--',
    'SPAPWMAA-------',
    '02',
    '110000',
    '01',
    '01',
    'Missile (Air Missile)',
    'Launch Origin : Air',
    'Missile Destination : Air',
    'SPAPWMAA-------',
    'pass'
  ]
*/
const COLUMNS = [
  'sidc',
  null,
  'set',
  'entity',
  'modifier1',
  'modifier2'
]

const trim = s => s.trim()
const columns = s => s.split(',').map(trim)
const mapping = columns => columns.reduce((acc, column, index) => {
  const key = COLUMNS[index]
  if (!key) return acc
  else acc[key] = column
  return acc
}, {})

const generify = ({ sidc, modifier1, modifier2, ...rest }) => ({
  ...rest,
  sidc: sidc.substring(0, 3) + '*' + sidc.substring(4),
  modifier: modifier1 + modifier2

})

const file = fs.readFileSync('./LegacyMappingTableCtoD.csv', 'utf8')
const lines = R.drop(1, file.split('\n'))
const output = lines.map(columns).map(mapping).map(generify)
console.log(JSON.stringify(output, null, 2))
