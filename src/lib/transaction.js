const errorMessages = require('./errorMessages')
const BCHJS = require('@chris.troutner/bch-js')
const BigNumber = require('bignumber.js')
const { TransactionBuilder, ECSignature } = require('bitcoincashjs-lib')

const bchjs = new BCHJS()

// enum SLP_SEND_OP_RETURN {
//     LOKAD_ID_INDEX = 1,
//     TOKEN_ID_INDEX = 4,
// }

const SLP_OP_RETURN_VOUT = 0
const LOKAD_ID_INDEX = 1
const LOKAD_ID_INDEX_VALUE = '534c5000'
const MIN_BYTES_INPUT = 181
const TOKEN_ID_INDEX = 4

class Transaction {
  constructor (config) {
    this.config = config
    this.bchjs = bchjs
  }

  addStampsForTransactionAndSignInputs (transaction, keyPairFromPostOffice, stamps) {
    const lastSlpInputVin = transaction.inputs.length - 1
    for (let i = 0; i < stamps.length; i++) {
      transaction.addInput(stamps[i].tx_hash, stamps[i].tx_pos)
    }

    for (let i = lastSlpInputVin + 1; i <= stamps.length; i++) {
      let redeemScript
      console.log('Signing...', i)
      transaction.sign(
        i,
        keyPairFromPostOffice,
        redeemScript,
        0x01, // SIGHASH_ALL
        this.config.postageRate.weight + MIN_BYTES_INPUT,
        ECSignature.ECDSA
      )
    }

    return transaction
  }

  // Get the stamps needed to complete the transaction.
  // Expects a JS object expressing a transaction.
  // Returns the number of stamps needed to complete the transaction.
  getNeededStamps (transaction) {
    // Configure the BigNumber library to round up.
    BigNumber.set({ ROUNDING_MODE: BigNumber.ROUND_UP })

    // Get the OP_RETURN output
    const transactionScript = this.bchjs.Script.toASM(
      transaction.outs[SLP_OP_RETURN_VOUT].script
    ).split(' ')

    // Ensure the Lokad ID exists in the OP_RETURN. Sanity check that it's a
    // SLP transaction.
    if (transactionScript[LOKAD_ID_INDEX] !== LOKAD_ID_INDEX_VALUE) {
      throw new Error(errorMessages.INVALID_SLP_OP_RETURN)
    }

    let neededStamps = 0
    let tokenOutputPostage = 0

    // Loop through each transaction output.
    for (let i = 1; i < transaction.outs.length; i++) {
      // Get the SLP address in this output of the transaction.
      const addressFromOut = this.bchjs.SLP.Address.toSLPAddress(
        this.bchjs.Address.fromOutputScript(transaction.outs[i].script)
      )

      // Get the post office address.
      const postOfficeAddress = this.config.postageRate.address

      // If the addresses match...?
      if (postOfficeAddress === addressFromOut) {
        tokenOutputPostage = TOKEN_ID_INDEX + i
      }
    }

    // If no postage was added, throw an error.
    if (tokenOutputPostage === 0) {
      throw new Error(errorMessages.INSUFFICIENT_POSTAGE)
    }

    // Check if token being spent is the same as described in the postage rate for the stamp
    // Check if postage is being paid accordingly
    const postagePaymentTokenId = transactionScript[TOKEN_ID_INDEX]
    const stampDetails =
          this.config.postageRate.stamps
            .filter(stamp => stamp.tokenId === postagePaymentTokenId)
            .pop() || false
    const minimumStampsNeeded =
          transaction.outs.length - transaction.ins.length + 1

    if (stampDetails) {
      const stampRate = new BigNumber(stampDetails.rate).times(
        10 ** stampDetails.decimals
      )

      const amountPostagePaid = new BigNumber(
        transactionScript[tokenOutputPostage],
        16
      ).times(10 ** stampDetails.decimals)

      if (
        amountPostagePaid.isLessThan(stampRate.times(minimumStampsNeeded))
      ) {
        throw new Error(errorMessages.INSUFFICIENT_POSTAGE)
      }
      neededStamps = Number(amountPostagePaid.dividedBy(stampRate).toFixed(0))
    } else {
      throw new Error(errorMessages.UNSUPPORTED_SLP_TOKEN)
    }

    return neededStamps
  }

  splitUtxosIntoStamps (utxos, hdNode) {
    const transactionBuilder =
          this.config.network === 'mainnet'
            ? new this.bchjs.TransactionBuilder()
            : new this.bchjs.TransactionBuilder('testnet')

    const originalAmount = utxos.reduce(
      (accumulator, utxo) => accumulator + utxo.value,
      0
    )

    const numberOfPossibleStamps =
          originalAmount / (this.config.postageRate.weight + MIN_BYTES_INPUT)
    const hypotheticalByteCount = this.bchjs.BitcoinCash.getByteCount(
      { P2PKH: utxos.length },
      { P2PKH: numberOfPossibleStamps }
    )
    const satoshisPerByte = 1.4
    const hypotheticalTxFee = Math.floor(
      satoshisPerByte * hypotheticalByteCount
    )
    let numberOfActualStamps =
          (originalAmount - hypotheticalTxFee) /
          (this.config.postageRate.weight + MIN_BYTES_INPUT)
    if (numberOfActualStamps > 100) {
      numberOfActualStamps = 50
    }

    utxos.forEach(utxo =>
      transactionBuilder.addInput(utxo.tx_hash, utxo.tx_pos)
    )
    const keyPair = this.bchjs.HDNode.toKeyPair(hdNode)
    const outputAddress = this.bchjs.HDNode.toCashAddress(hdNode)
    const byteCount = this.bchjs.BitcoinCash.getByteCount(
      { P2PKH: utxos.length },
      { P2PKH: numberOfActualStamps }
    )
    const txFee = Math.floor(satoshisPerByte * byteCount)
    const totalSatoshisToSend =
          (this.config.postageRate.weight + MIN_BYTES_INPUT) * numberOfActualStamps

    for (let i = 0; i < numberOfActualStamps; i++) {
      transactionBuilder.addOutput(
        outputAddress,
        this.config.postageRate.weight + MIN_BYTES_INPUT
      )
    }
    const change = originalAmount - totalSatoshisToSend - txFee
    if (change > 1082) {
      transactionBuilder.addOutput(outputAddress, change)
    }

    // Sign the transaction with the HD node.
    let redeemScript
    for (let i = 0; i < utxos.length; i++) {
      transactionBuilder.sign(
        i,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        utxos[i].value
      )
    }

    const tx = transactionBuilder.build()
    const hex = tx.toHex()

    return hex
  }

  buildTransaction (incomingTransaction, stamps, keyPairFromPostOffice) {
    const newTransaction = TransactionBuilder.fromTransaction(
      incomingTransaction,
      this.config.network
    )
    const newTransactionHex = this.addStampsForTransactionAndSignInputs(
      newTransaction,
      keyPairFromPostOffice,
      stamps
    )
      .build()
      .toHex()
    return newTransactionHex
  }
}

module.exports = Transaction
