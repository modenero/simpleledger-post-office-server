/*
  Unit tests for transaction library.
*/

const assert = require('chai').assert
const sinon = require('sinon')
const { Transaction: BitcoinCashJSTransaction } = require('bitcoincashjs-lib')

const Transaction = require('../../src/lib/transaction')
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

  describe('#splitUtxosIntoStamps', () => {
    it('should raise an error on providing empty utxo list', async () => {
      try {
        const rootSeed = await transaction.bchjs.Mnemonic.toSeed(config.mnemonic)
        const hdNode = transaction.bchjs.HDNode.fromSeed(rootSeed)

        transaction.splitUtxosIntoStamps([], hdNode)
        assert.equal(true, false, 'Unexpected result!')
      } catch (err) {
        // console.log(err.message)
        assert.include(
          err.message,
          'Transaction has no inputs'
        )
      }
    })

    it('should complete execution withot any errors', async () => {
      const rootSeed = await transaction.bchjs.Mnemonic.toSeed(config.mnemonic)
      const hdNode = transaction.bchjs.HDNode.fromSeed(rootSeed)

      transaction.splitUtxosIntoStamps(mockData.utxosMock, hdNode)
    })
  })

  describe('#buildTransaction', () => {
    it('should complete execution withot any errors', async () => {
      const rootSeed = await transaction.bchjs.Mnemonic.toSeed(config.mnemonic)
      const hdNode = transaction.bchjs.HDNode.fromSeed(rootSeed)
      const keyPairFromPostOffice = transaction.bchjs.HDNode.toKeyPair(hdNode)
      const transactionHex =
        '0200000001ca6193753fe1e19d89c8785b89bd7bfd0f37efbd0037a27e2126e9fffaa87882030000006a47304402204863028b70ccee19721d6d06489a300be559d4906f3e92c2bdb4b215dd9a4de702201e21f572dfb914f6579388b58275896d5dcc3659164f252bb33a2c6d8ac03897c12103232b147c9483c6e7203b4f8a53c20fade7c12f2791e2e8303b78a5675c0bdad1ffffffff030000000000000000496a04534c500001010453454e44209fc89d6b7d5be2eac0b3787c5b8236bca5de641b5bafafc8f450727b63615c110800000000000f42400800000000001d8e8c080000000000a6697c22020000000000001976a91411ced8ef27158c6f6f68190e555c2747ed5427e888ac22020000000000001976a914cd27ed2b9c07fd478074d52c40cc7136836fd0cb88ac00000000'
      const incomingTransaction = BitcoinCashJSTransaction.fromHex(transactionHex)

      transaction.buildTransaction(incomingTransaction, mockData.stampsMock, keyPairFromPostOffice)
    })
  })
})
