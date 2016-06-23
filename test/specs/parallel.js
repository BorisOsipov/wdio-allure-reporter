'use strict'
const helper = require('../helper')
const expect = require('chai').expect

describe('parallel', () => {
    beforeEach(helper.clean)

    it('should run several suites in parallel', () => {
        return helper.run(['broken', 'failing']).then((results) => {
            expect(results).to.have.lengthOf(2)
            const startTimes = results.map(result => result('test-case').attr('start'))
            const stopTimes = results.map(result => result('test-case').attr('stop'))
            expect(stopTimes[0]).to.be.above(startTimes[1])
            expect(stopTimes[1]).to.be.above(startTimes[0])
        })
    })
})
