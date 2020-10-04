/*
  Unit tests for post-office.js.
*/

const chai = require('chai')
const assert = chai.assert
const chaiHttp = require('chai-http')
const sinon = require('sinon')

const Network = require('../../src/lib/network')

chai.use(chaiHttp)
describe('#post-office.js', () => {
  let sandbox
  let server

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    server = require('../../post-office')
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('#getRootEndpoint', () => {
    it('should return postage rate data', async function () {
      // Mock network calls.
      sandbox
        .stub(Network.prototype, 'validateSLPInputs')
        .resolves([])
      sandbox
        .stub(Network.prototype, 'fetchUTXOsForNumberOfStampsNeeded')
        .resolves([])
      sandbox
        .stub(Network.prototype, 'broadcastTransaction')
        .resolves({})

      chai.request(server).get('/').end((err, res) => {
        assert.equal(res.status, 200)

        const result = JSON.parse(res.text)
        assert.property(result, 'version')
        assert.property(result, 'address')
        assert.property(result, 'weight')
        assert.property(result, 'stamps')
        assert.isArray(result.stamps)

        assert.isNull(err)
      })
    })
  })

  describe('#getPostageEndpoint', () => {
    it('should return postage rate data', async function () {
      // Mock network calls.
      sandbox
        .stub(Network.prototype, 'validateSLPInputs')
        .resolves([])
      sandbox
        .stub(Network.prototype, 'fetchUTXOsForNumberOfStampsNeeded')
        .resolves([])
      sandbox
        .stub(Network.prototype, 'broadcastTransaction')
        .resolves({})

      chai.request(server).get('/postage').end((err, res) => {
        assert.equal(res.status, 200)

        const result = JSON.parse(res.text)
        assert.property(result, 'version')
        assert.property(result, 'address')
        assert.property(result, 'weight')
        assert.property(result, 'stamps')
        assert.isArray(result.stamps)

        assert.isNull(err)
      })
    })
  })

})
