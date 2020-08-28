/*
  Unit tests for transaction library.
*/

const assert = require('chai').assert
const sinon = require('sinon')

const { Transaction } = require('../../src/lib/transaction')
const config = require('../../config')
const mockData = require('../mocks/transaction.mocks.js')

describe('#transaction.js', () => {
  let sandbox
  let transaction

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    transaction = new Transaction(config)
  })

  afterEach(() => sandbox.restore())

  describe('#addStampsForTransactionAndSignInputs', () => {
    it('should complete execution wihtout any error', async () => {
      try {
        transaction.addStampsForTransactionAndSignInputs(mockData.transactionMock, {}, mockData.stampsMock)
      } catch (err) {
        assert.equal(true, false, 'Unexpected result!')
      }
    })
  })

  describe('#getNeededStamps', () => {
    // negative tests
    it('should raise an INVALID_SLP_OP_RETURN error on invalid SLP OP_RETURN data provided', async () => {
      try {
        transaction.getNeededStamps(mockData.invalidSLPOPReturnTxMock)
        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        assert.include(
          err.message,
          'Could not parse OP_RETURN output'
        )
      }
    })

    it('should raise an INSUFFICIENT_POSTAGE error on transaction providing no payment to the server', async () => {
      try {
        transaction.getNeededStamps(mockData.validSLPOPReturnTxWithNoPaymentToServerMock)
        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        assert.include(
          err.message,
          'Insufficient postage paid'
        )
      }
    })

    it('should raise an UNSUPPORTED_SLP_TOKEN error on transaction using a token not supported by the server', async () => {
      try {
        transaction.getNeededStamps(mockData.unsupportedTokenTxMock)
        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        assert.include(
          err.message,
          'Unsupported SLP token'
        )
      }
    })

    it('should raise an INSUFFICIENT_POSTAGE error on transaction providing a payment output to the server with less than required amount', async () => {
      try {
        transaction.getNeededStamps(mockData.supportedTokenTxWithInsufficientPostagePaymentMock)
        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        assert.include(
          err.message,
          'Insufficient postage paid'
        )
      }
    })

    // positive tests
    it('should complete execution without raising any error, returning needed amount of stamps', async () => {
      const neededStamps = transaction.getNeededStamps(mockData.validSLPTxWithSufficiantPaymentToServerMock)
      assert.equal(neededStamps, 150000)
    })
  })
})
