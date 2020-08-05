// Global npm libraries.
const express = require('express')
const cors = require('cors')
const PaymentProtocol = require('bitcore-payment-protocol')
const { Transaction } = require('bitcoincashjs-lib')
const BCHJS = require('@chris.troutner/bch-js')

// Local libraries.
const config = require('./config')
const slpMiddleware = require('./src/lib/slpMiddleware')
const errorMessages = require('./src/lib/errorMessages')
const {
  getNeededStamps,
  buildTransaction,
  splitUtxosIntoStamps
} = require('./src/lib/transaction')
const {
  fetchUTXOsForNumberOfStampsNeeded,
  validateSLPInputs,
  fetchUTXOsForStampGeneration,
  broadcastTransaction
} = require('./src/lib/network')

// Instantiate bch-js.
const bchjs = new BCHJS({
  restURL:
        config.network === 'mainnet'
          ? 'https://api.fullstack.cash/v3/'
          : 'https://tapi.fullstack.cash/v3/',
  apiToken: config.apiKey
})

// Instantiate express.
const app = express()
app.use(cors())
app.use(slpMiddleware)

app.get('/postage', function (req, res) {
  res.send(config.postageRate)
})

app.post('/postage', async function (req, res) {
  const paymentProtocol = new PaymentProtocol('BCH')
  try {
    if (!req.is('application/simpleledger-payment')) {
      res.status(400).send(errorMessages.UNSUPPORTED_CONTENT_TYPE)
      return
    }

    const rootSeed = await bchjs.Mnemonic.toSeed(config.mnemonic)
    const hdNode = bchjs.HDNode.fromSeed(rootSeed)
    const keyPair = bchjs.HDNode.toKeyPair(hdNode)
    const payment = PaymentProtocol.Payment.decode(req.raw)
    const incomingTransaction = Transaction.fromHex(
      payment.transactions[0].toString('hex')
    )
    await validateSLPInputs(incomingTransaction.ins)
    const neededStampsForTransaction = getNeededStamps(incomingTransaction)
    const stamps = await fetchUTXOsForNumberOfStampsNeeded(
      neededStampsForTransaction,
      bchjs.HDNode.toCashAddress(hdNode)
    )
    const stampedTransaction = buildTransaction(
      incomingTransaction,
      stamps,
      keyPair
    )
    const transactionId = await broadcastTransaction(stampedTransaction)
    const memo = `Transaction Broadcasted: https://explorer.bitcoin.com/bch/tx/${transactionId}`
    payment.transactions[0] = stampedTransaction
    const paymentAck = paymentProtocol.makePaymentACK(
      { payment, memo },
      'BCH'
    )
    res.status(200).send(paymentAck.serialize())
  } catch (e) {
    console.error(e)
    if (Object.values(errorMessages).includes(e.message)) {
      res.status(400).send(e.message)
    } else {
      res.status(500).send(e.message)
    }
  }
})

// Start the server.
app.listen(3000, async () => {
  const rootSeed = await bchjs.Mnemonic.toSeed(config.mnemonic)
  const hdNode = bchjs.HDNode.fromSeed(rootSeed)
  const cashAddress = bchjs.HDNode.toCashAddress(hdNode)

  const generateStamps = async () => {
    console.log('Generating stamps...')
    try {
      const utxosToSplit = await fetchUTXOsForStampGeneration(cashAddress)
      const splitTransaction = splitUtxosIntoStamps(utxosToSplit, hdNode)
      await broadcastTransaction(splitTransaction)
    } catch (e) {
      console.error(e.message || e.error || e)
    }
  }

  const stampGenerationIntervalInMinutes = 30
  setInterval(generateStamps, 1000 * 60 * stampGenerationIntervalInMinutes)

  console.log(`Send stamps to: ${bchjs.HDNode.toCashAddress(hdNode)}`)
  console.log('Post Office listening on port 3000!')
  generateStamps()
})
