To accept Tempo testnet, the unpaid response must be HTTP `402` with this header:

```http
WWW-Authenticate: Payment id="…", method="tempo", intent="charge", request="…"
```

There is no separate `testnet` header. Testnet is `chainId` inside the base64url JSON in `request`:

```json
{
  "amount": "10000",
  "currency": "0x20c0000000000000000000006a37DA5C996874BE",
  "recipient": "0x…",
  "methodDetails": { "chainId": 42431 }
}
```

`42431` is Tempo testnet. `4217` is mainnet, and a testnet client will reject it.

With `mppx`, that chain id comes from the charge config, not from a hand-written header:

```javascript
tempo.charge({
  testnet: true, // same as chainId: 42431
  recipient,     // testnet address that receives the payment
})
```

`amount` is in the token’s smallest units. For a $0.01 charge of a 6-decimal stablecoin, that is `"10000"`.
