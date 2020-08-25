/*
  Contains mocks of transaction library.
*/

const sinon = require('sinon')

const transactionMock = {
  inputs: [
    {
      pubKeys: [
        Buffer.from(
          '03083dfc5a0254613941ddc91af39ff90cd711cdcde03a87b144b883b524660c39',
          'hex')
      ],
      signatures: [
        Buffer.from(
          '30440220540986d1c58d6e76f8f05501c520c38ce55393d0ed7ed3c3a82c69af04221232022058ea43ed6c05fec0eccce749a63332ed4525460105346f11108b9c26df93cd7201',
          'hex'
        )
      ],
      prevOutScript: undefined,
      prevOutType: 'pubkeyhash',
      signType: 'pubkeyhash',
      signScript: undefined,
      witness: false
    }
  ],
  addInput: sinon.stub().returns(undefined),
  sign: sinon.stub().returns(true)
}

const stampsMock = [
  {
    height: 629922,
    tx_hash: 'd5228d2cdc77fbe5a9aa79f19b0933b6802f9f0067f42847fc4fe343664723e5',
    tx_pos: 0,
    value: 6000
  }
]

module.exports = {
  transactionMock,
  stampsMock
}
