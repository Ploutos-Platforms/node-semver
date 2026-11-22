'use strict'

const SemVer = require('../classes/semver')
const Range = require('../classes/range')
const gt = require('../functions/gt')

const minVersion = (range, loose) => {
  range = new Range(range, loose)

  let minver = new SemVer('0.0.0-0')
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer('0.0.0')
  if (range.test(minver)) {
    for (let i = 0; i < range.set.length; ++i) {
      const comparators = range.set[i]
      for (let j = 0; j < comparators.length; ++j) {
        const comparator = comparators[j]
        if ((comparator.operator === '' || comparator.operator === '>=') &&
          comparator.semver.major === 0 &&
          comparator.semver.minor === 0 &&
          comparator.semver.patch === 0 &&
          comparator.semver.prerelease.length) {
          return new SemVer(comparator.semver.version)
        }
      }
    }
    return minver
  }

  minver = null
  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i]

    let setMin = null
    comparators.forEach((comparator) => {
      // Clone to avoid manipulating the comparator's semver object.
      const compver = new SemVer(comparator.semver.version)
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++
          } else {
            compver.prerelease.push(0)
          }
          compver.raw = compver.format()
          /* fallthrough */
        case '':
        case '>=':
          if (!setMin || gt(compver, setMin)) {
            setMin = compver
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected operation: ${comparator.operator}`)
      }
    })
    if (setMin && (!minver || gt(minver, setMin))) {
      minver = setMin
    }
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
}
module.exports = minVersion
