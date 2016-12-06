'use strict'
const fs = require('fs')
const _ = require('lodash/fp')

// const plainText = fs.readFileSync('./words.txt', 'utf-8')
const plainText = fs.readFileSync('./google-10000-english.txt', 'utf-8')
const words = _.filter(w => w.length > 0)(plainText.split('\n'))

const string = fs.readFileSync('./string.txt', 'utf-8').replace(/ /g, '')

const splitWords = ({ pre = [], chars }) => {
  // console.log({pre, chars})
  // ignore single char and non-alpha
  if (chars.length < 1) return [pre]
  if (chars.length == 1) return [pre.concat(chars)]
  const matches = words.reduce((matches, word) => {
    const match = chars.substring(0, word.length)
    if (word == _.toLower(match)) return [...matches, match]
    return matches
  }, [])
  matches.push(chars[0])
  // if (matches.length == 0) {
  //   return splitWords({
  //     pre: pre.concat(chars[0]),
  //     chars: chars.substring(1),
  //   })
  // }
  const processedMatches = matches.map(word => {
    return splitWords({
      pre: pre.concat(word),
      chars: chars.substring(word.length),
    })
  })
  const fix = _.flow(_.flatten, _.compact)
  return fix(processedMatches)
}


const maxWord = words.length
function findBest(paths, max) {
  const scores = paths.map(ws => {
    // optimize for least words and most common words
    const commonality = ws
       // how common each word is (0 = most common)
      .map(w => words.indexOf(w) / maxWord)
       // ajust for words not found (-1)
      .map(c => c < 0 ? 1 : c)
      // avg
      .reduce((acc, c, i, arr) => 
        acc + c/arr.length, 0)
    const fragmenticity = ws.length / max
    return commonality + fragmenticity
  })
  const bestIndex = scores.reduce((min, i) =>
    i < min ? i : min, Infinity)
  const best = paths[_.indexOf(bestIndex)(scores)]
  console.log({paths, scores, best })
  return best
}

function streamify(str, acc = '') {
  const max = 12
  const chars = str.substring(0, max)
  const left = str.substring(max)
  const paths = splitWords({ chars })
  const best = findBest(paths, max)
  const [first, ...last] = best
  const next = last.join('') + left
  if (next.length == 0) {
    console.log(acc + best.join(' '))
    return acc + best.join(' ')
  }
  const notLetter = /[^a-z]+/ig.test(next[0])
  if (notLetter) return streamify(next.substring(1), acc + first + next[0] + ' ')
  return streamify(next, acc + first + ' ')
}

const addSpaces = string =>
  string.split('\n').map(line => streamify(line)).join('\n')

fs.writeFileSync('./string.txt', addSpaces(string))
