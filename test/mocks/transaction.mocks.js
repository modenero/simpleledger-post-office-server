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

const invalidSLPOPReturnTxMock = {
  version: 2,
  locktime: 0,
  ins: [],
  outs: [
    {
      value: 0,
      script: Buffer.from( // invalid lokad id index value
        '6a04534c5001510453454e44204de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf0800000022ecb25c000800007eb55317a5b2',
        'hex'
      )
    }
  ]
}

const validSLPOPReturnTxWithNoPaymentToServerMock = {
  version: 2,
  locktime: 0,
  ins: [],
  outs: [
    {
      value: 0,
      script: Buffer.from(
        '6a04534c500001010453454e44204de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf0800000022ecb25c000800007eb55317a5b2',
        'hex'
      )
    },
    {
      value: 0,
      script: Buffer.from(
        '76a9147f79ad91bf688c62d545c4ca1c8cb1d704caf3dd88ac',
        'hex'
      )
    }
  ]
}

const unsupportedTokenTxMock = {
  version: 2,
  locktime: 0,
  ins: [],
  outs: [
    {
      value: 0,
      script: Buffer.from(
        '6a04534c500001010453454e44204de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf0800000022ecb25c000800007eb55317a5b2',
        'hex'
      )
    },
    {
      value: 0,
      script: Buffer.from(
        '76a91495ee39ad723020d9887e4132677fe827fe9bd46788ac',
        'hex'
      )
    }
  ]
}

const supportedTokenTxWithInsufficientPostagePaymentMock = {
  version: 2,
  locktime: 0,
  ins: [],
  outs: [
    {
      value: 0,
      script: Buffer.from(
        '6a04534c5000510453454e442038e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b001160800007eb55317a5b2',
        'hex'
      )
    },
    {
      value: 0,
      script: Buffer.from(
        '76a91495ee39ad723020d9887e4132677fe827fe9bd46788ac',
        'hex'
      )
    }
  ]
}

const validSLPTxWithSufficiantPaymentToServerMock = {
  version: 2,
  locktime: 0,
  ins: [],
  outs: [
    {
      value: 0,
      script: Buffer.from(
        '6a04534c5000510453454e442038e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b00800000022ecb25c000800007eb55317a5b2',
        'hex'
      )
    },
    {
      value: 0,
      script: Buffer.from(
        '76a91495ee39ad723020d9887e4132677fe827fe9bd46788ac',
        'hex'
      )
    }
  ]
}

module.exports = {
  transactionMock,
  stampsMock,
  invalidSLPOPReturnTxMock,
  validSLPOPReturnTxWithNoPaymentToServerMock,
  unsupportedTokenTxMock,
  supportedTokenTxWithInsufficientPostagePaymentMock,
  validSLPTxWithSufficiantPaymentToServerMock
}
