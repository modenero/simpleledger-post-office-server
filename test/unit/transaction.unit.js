/*
  Unit tests for transaction library.
*/

const assert = require('chai').assert
const sinon = require('sinon')

const { Transaction } = require('../../src/lib/transaction')
const mockData = require('../mocks/transaction.mocks.js')

describe('#transaction.js', () => {
  let sandbox
  let transaction

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    transaction = new Transaction()
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
})
