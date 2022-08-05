# Understanding the concepts behind Flow

As a developer, gas fees and smart contract security can present a huge challenge for you. If you don't write your code perfectly the first time, you will not be able to change it later: This presents a massive security risk.

Flow solves this problem.

## Beta contracts

Flow allows you to push a *"beta smart contract"* to their main network. You will be able to make changes to your beta contract while it's still in beta phase. This is very helpful during development as it allows the developers to rectify mistakes and bugs. Writing perfect code the first time around is exceptionally rare.

Once you decide to finalize the contract, you can choose take it out of beta phase. This will make your smart contract immutable (unchangeable).

![](https://i.imgur.com/2Xim6eR.png)


## Accounts
An account on Flow contains various things:

* **Address**,
* **Token Balance**
* **Public Keys**
* **Code**
* **Storage**.

This is a cool feature because, unlike Ethereum, you are allowed to have one central place to store all of your data.

Another cool feature of flow is that there are no cryptographic public keys, and Flow addresses are not derived from keypairs. Instead, each Flow address is assigned by an on-chain function that follows a deterministic addressing sequence.

The result of this is that you are also allowed to have multiple accounts share one public key or vice-versa. This can be incredibly useful for development work. It also allows for things like multisig wallets natively on the network, without needing to implement complicated Multisig smart contracts.

To create an account on Flow, users are actually required to submit an on-chain account creation transaction. However, since they don't already have their own account, they must get somebody else to pay for the gas fees and propose the transaction. Typically, Flow wallets cover the gas fees for creating a new account through them.

This is another cool feature of Flow, where transactions can be made by someone and paid for by someone else entirely. This is also natively built into the network.

## Keys

As mentioned above, an account on Flow can have multiple keys. Also, the same key can be used across multiple accounts. New keys can be added to an account by submitting an on-chain transaction, and similarly for removing a key from an account.

Each key has a certain **weight** - which is an integer between 1 and 1000. A transaction can only be signed if there is enough keys to have a total of at least 1000 weight on them.

Therefore, if you wanted to create, let's say, a 2/3 multisig wallet, you can attach 3 keys to the account such that:

Key A = Weight 500
Key B = Weight 500
Key C = Weight 500

Then as long as two of these keys sign the transaction, the overall weight becomes 1000, and the transaction can be authorized and broadcasted.

## Signing Transactions

As mentioned above as well, on Flow you can have someone pay for a transaction while having someone else broadcast it from their account. This can be done because on Flow, signing a transaction is a multi-step process.

There are three roles that are involved:
- Proposer
- Payer
- Authorizer(s)

The Proposer is the signer on whose behalf the transaction will be made.

The Payer is the signer who will pay for the gas fees of this transaction.

The Authorizer(s) are the (set of) keys that sign over the transaction and authorize it

For most use cases, these three values refer to the same account. However, for things like creating a new account, or multi-sig wallets, having these options is a very easy way to do things on Flow.

![](https://i.imgur.com/BeW04Gl.png)


## Storing Data on Flow

*Each* flow account has some amount of network storage that it's allowed to use. How much storage you get is dictated by how much FLOW tokens you have in your account. The minimum any flow account can have is 0.001.

The *exact* amount of storage you have is your FLOW tokens multiplied by the **storageBytesPerReservedFlow** variable defined on the StorageFees smart contract, which is roughly 100 MB per flow token.

## Segmented Transaction Fees

Flow has transaction fees. Just like with Ethereum, transaction fees are necessary in-order to maintain the *security* of the Flow network. By requiring a fee for every computation executed on the network, bad actors are prevented from spamming the network.

For example, if a bad actor wanted to spam the network, gas fees would make it financially infeasible.

The fee on flow is calculated using **3** different components:
- An Execution fee
- An Inclusion fee
- A Network surge factor fee.

The Execution Fees depends on the complexity of the transaction being executed. The more computation that is required, the higher the execution fees.

The Inclusion Fees depends on the effort required to include a transaction in a block, broadcast it node-to-node to everyone on the network, and verify all the transaction signatures. Currently, these values are fixed and are not variable.

The Network Surge Fees currently does not apply, and is fixed. In the future, however, this has been reserved as a way to charge higher fees during massive network usage to stabilize demand and supply.

