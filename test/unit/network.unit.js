/*
  Unit tests for network library.
*/

const assert = require('chai').assert
const sinon = require('sinon')

const Network = require('../../src/lib/network')
const mockData = require('../mocks/network.mocks.js')

describe('#network.js', () => {
  let sandbox
  let uut

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new Network()
  })

  afterEach(() => sandbox.restore())

  describe('#fetchUTXOsForStampGeneration', () => {
    // This is an example of a 'positive' test case. Passing is a success.
    it('should get utxos', async () => {
      const addr =
                'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      // Mock network calls.
      sandbox
        .stub(uut.bchjs.Electrumx, 'utxo')
        .resolves(mockData.mockUtxo)

      const result = await uut.fetchUTXOsForStampGeneration(addr)
      // console.log(`result: ${JSON.stringify(result, null, 2)}`)

      assert.isArray(result)
      assert.property(result[0], 'height')
      assert.property(result[0], 'tx_hash')
      assert.property(result[0], 'tx_pos')
      assert.property(result[0], 'value')
    })

    // This is an example of a 'negative' test case. Passing is a failure.
    // Throwing an error is the expected behavior. So if it throws an error, that
    // is a success.
    // Notice the try/catch statement in the test case. That signals that it is
    // a negative test case.
    it('should throw an error if there are no UTXOs', async () => {
      try {
        const addr =
                    'bitcoincash:qqhks6pe9guacunnz0w8l886ar4ac77pmcmp5yepy6'

        // Mock network calls.
        sandbox
          .stub(uut.bchjs.Electrumx, 'utxo')
          .resolves(mockData.emptyUtxo)

        await uut.fetchUTXOsForStampGeneration(addr)
        // console.log(`result: ${JSON.stringify(result, null, 2)}`)

        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(
          err.message,
          'Insufficient Balance for Stamp Generation'
        )
      }
    })
  })

  describe('#fetchUTXOsForNumberOfStampsNeeded', () => {
    it('should return stamp', async () => {
      const addr =
                'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

      // Mock network calls.
      sandbox
        .stub(uut.bchjs.Electrumx, 'utxo')
        .resolves(mockData.mockUtxo)
      sandbox
        .stub(uut.bchjs.SLP.Utils, 'validateTxid')
        .resolves(mockData.invalidSingleSLPValidateTxidResponse)

      const result = await uut.fetchUTXOsForNumberOfStampsNeeded(1, addr)
      assert.equal(result.length, 1)
    })

    it('should throw and error if there are not enough stamps', async () => {
      try {
        const addr =
                  'bitcoincash:qzs02v05l7qs5s24srqju498qu55dwuj0cx5ehjm2c'

        // Mock network calls.
        sandbox
          .stub(uut.bchjs.Electrumx, 'utxo')
          .resolves(mockData.mockUtxo)
        sandbox
          .stub(uut.bchjs.SLP.Utils, 'validateTxid')
          .resolves(mockData.invalidSingleSLPValidateTxidResponse)

        await uut.fetchUTXOsForNumberOfStampsNeeded(2, addr)

        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(
          err.message,
          'Stamps currently unavailable. In need of refill'
        )
      }
    })
  })

  describe('#validateSLPInputs', () => {
    it('should execute without throwing any error when input is valid', async () => {
      const inputs = [
        {
          hash: Buffer.from(
            '66ee71259057ad62dd3fe8b8ebaa7feede89a92b96c13460a8c2446f327f5f48',
            'hex'
          )
        }
      ]
      // Mock network calls.
      sandbox
        .stub(uut.bchjs.SLP.Utils, 'validateTxid')
        .resolves(mockData.validSingleSLPValidateTxidResponse)

      await uut.validateSLPInputs(inputs)
    })

    it('should throw an error if input is invalid', async () => {
      try {
        const inputs = [
          {
            hash: Buffer.from(
              '66ee71259057ad62dd3fe8b8ebaa7feede89a92b96c13460a8c2446f327f5f48',
              'hex'
            )
          }
        ]
        // Mock network calls.
        sandbox
          .stub(uut.bchjs.SLP.Utils, 'validateTxid')
          .resolves(mockData.invalidSingleSLPValidateTxidResponse)

        await uut.validateSLPInputs(inputs)
        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(
          err.message,
          'Invalid Payment'
        )
      }
    })
  })

  describe('#broadcastTransaction', () => {
    it('should return a transaction id for the broadcasted transaction', async () => {
      const mockTransactionId = 'fe28050b93faea61fa88c4c630f0e1f0a1c24d0082dd0e10d369e13212128f33'

      // Mock network calls.
      sandbox
        .stub(uut.bchjs.RawTransactions, 'sendRawTransaction')
        .resolves(mockTransactionId)

      const returnedTransactionID = await uut.broadcastTransaction('')
      assert.equal(returnedTransactionID, mockTransactionId)
    })
  })
})
