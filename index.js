'use strict'

const fs = require('fs')
const _ = require('lodash/fp')

// const plainText = fs.readFileSync('./words.txt', 'utf-8')
const plainText = fs.readFileSync('./google-10000-english.txt', 'utf-8')
const words = _.filter(w => w.length > 0)(plainText.split('\n'))

const string = fs.readFileSync('./string.txt', 'utf-8').replace(/ /g, '')

const splitWords = ({ pre = [], chars }) => {
  // ignore single char and non-alpha
  if (chars.length < 1) return [pre]
  if (chars.length == 1) return [pre.concat(chars)]
  const matches = words.reduce((matches, word) => {
    const match = chars.substring(0, word.length)
    if (word == _.toLower(match)) return [...matches, match]
    return matches
  }, [])
  const fix = _.flow(_.flatten, _.compact)
  if (matches.length == 0) {
    return splitWords({
      pre: pre.concat(chars[0]),
      chars: chars.substring(1),
    })
  }
  return fix(matches.map(word => {
    return splitWords({
      pre: pre.concat(word),
      chars: chars.substring(word.length),
    })
  }))
}


function findBest(paths) {
  const scores = paths.map(ws => ws.length)
  const best = scores.reduce((min, i) =>
    i < min ? i : min, Infinity)
  return paths[_.indexOf(best)(scores)]
}

function streamify(str, ok = '') {
  const max = 12
  const chars = str.substring(0, max)
  const left = str.substring(max)
  const paths = splitWords({ chars })
  const best = findBest(paths)
  if (left.length == 0) {
    console.log(ok + best.join(' '))
    return ok + best.join(' ')
  }
  const [first, ...last] = best
  if (last.length == 0) return streamify(left, ok + first + ' ')
  if (/[^a-z]+/ig.test(last[0])) return streamify(last.join('') + left, ok + first)
  return streamify(last.join('') + left, ok + first + ' ')
}

const addSpaces = string =>
  string.split('\n').map(line => streamify(line)).join('\n')

fs.writeFileSync('./string.txt', addSpaces(string))
