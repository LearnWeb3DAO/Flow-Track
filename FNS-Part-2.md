# Ship your own name service on FLOW - Part 2 - Setting up for Deployment

![](https://i.imgur.com/DjGVpCU.png)

Great! You've gone through a LONG tutorial on how to build the Domains contract. You learnt a shit ton of things. Now, it's time to deploy to the Flow testnet, and set up your environment to be able to do that.

Since Flow is relatively earlier stage, compared to more mature ecosystems like Ethereum, the developer tooling is a bit lower-level than Ethereum. It takes a bit of setup to get everything working, however you get used to it very quickly. This is why we have decided to keep the environment setup as a separate level entirely to make sure we can explain each step properly.

## 🌊 flow.json

When you created your app initially in the last level using `flow app create flow-name-service` it set up a project structure for you to work off of.

In the folder `flow-name-service`, the most important file we will be working with is `flow.json`. This is the configuration file for the Flow CLI, and defines the configuration for actions that the Flow CLI can perform for you.

Think of this as roughly equivalent to `hardhat.config.js` on Ethereum.

Open this file up in your code editor, and the default should look something like this:

```json
{
  "emulators": {
    "default": {
      "port": 3569,
      "serviceAccount": "emulator-account"
    }
  },
  "contracts": {},
  "networks": {
    "emulator": "127.0.0.1:3569",
    "mainnet": "access.mainnet.nodes.onflow.org:9000",
    "testnet": "access.devnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "emulator-account": {
      "address": "f8d6e0586b0a20c7",
      "key": "2619878f0e2ff438d17835c2a4561cb87b4d24d72d12ec34569acd0dd4af7c21"
    }
  },
  "deployments": {}
}
```

You see it comes pre-configured with one `account` - the `emulator-account`. This account does not work on the Flow Testnet or Mainnet, and is only to be used with the local Flow Emulator - which is similar to running a local Hardhat node.

In our case, we will not be touching the Emulator and will deploy to the Flow testnet.

## 🧾 Create a Testnet Account

One of the first things we want to do is generate a new account for use on the Flow Testnet. Since the Emulator Account is the same for everyone, we should really not be using it for anything on Testnet or Mainnet, as it is accessible to thousands of people.

Let's walk through the process of creating a new Testnet account, and adding it to the configuration.

In your terminal, `cd` into the `flow-name-service` directory on your computer, and execute the following command:

```shell
flow keys generate
```

This should give you a Private key and a Public key to work with.

Now, on Flow, an account (address) can have multiple keys attached to it. Therefore, just generating a keypair is not enough. We have to link the keypair to an account (or generate a new account) and link the keypair to it.

Thankfully, the Flow Testnet Faucet makes this really easy to do! It will link our keypair to an account on the Flow Testnet, and also airdrop 1000 Flow Tokens for us to cover gas fees with, that's awesome!

Open up the [Flow Testnet Faucet](https://testnet-faucet.onflow.org), and follow these steps:

1. Copy the Public Key from your Terminal
2. Paste it into the `Public Key` text box on the Faucet page
3. Leave the `Signature and Hash Algorithm` fields as-is
4. Verify the CAPTCHA
5. Click `Create Account`

After a few seconds of loading, it should give you back an account address! It will also tell you that it airdropped 1000 Flow Tokens into that account!

Now, in your terminal, type the following command:

```shell
flow config add account
```

1. Enter 'testnet' for the Name
2. Enter the address given to you by the faucet for the Address
3. Choose the default options (ECDSA_P256 and SHA3_256) for the signature and hashing algorithm used
4. Enter the Private Key that was generated in the earlier step through your terminal
5. Choose the default option for the Key Index (0)

Awesome! If you look at your `flow.json` file now, it will look something like this:

```json
{
  "emulators": {
    "default": {
      "port": 3569,
      "serviceAccount": "emulator-account"
    }
  },
  "contracts": {},
  "networks": {
    "emulator": "127.0.0.1:3569",
    "mainnet": "access.mainnet.nodes.onflow.org:9000",
    "testnet": "access.devnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "emulator-account": {
      "address": "f8d6e0586b0a20c7",
      "key": "2619878f0e2ff438d17835c2a4561cb87b4d24d72d12ec34569acd0dd4af7c21"
    },
    "testnet": {
      "address": "a47932041e18e39a",
      "key": "e31fa3014f4d8400c93c25e1939f24f982b72fa9359433ff06126c40428c7548"
    }
  },
  "deployments": {}
}
```

Notice that a new `testnet` account has been added under the `accounts` property of the JSON object. Great!

## 📁 Add Contract Paths and Aliases

If you remember, in the contract we wrote, we were importing the other contracts through the file path.

For example, we did things like

```javascript
import NonFungibleToken from "./interfaces/NonFungibleToken.cdc";
```

However, if you remember from the `TaskTracker` level and the Flow Playground, contracts are actually imported on Flow from addresses, not from files.

The standard contracts we are using - `NonFungibleToken`, `FungibleToken`, and `FlowToken` - are part of the Flow Blockchain's Core Contracts, and have pre-defined addresses on both Testnet and Mainnet. You can find these addresses listed here - [Flow Core Contracts](https://docs.onflow.org/core-contracts/)

What I'm getting to is that when we go to deploy our contracts, we will need to change the imports. Additionally, the addresses for the core contracts are different on Testnet and Mainnet.

It would be a huge pain having to manually change the imports every single time you want to deploy the contract or push an update (since Flow contracts are upgradeable).

Thankfully, `flow.json` and the Flow CLI make this easy! We can configure the `flow.json` file to specify aliases for the contracts we are using, i.e. provide the Testnet (and potentially Mainnet) addresses of the contracts we are using, and it will automatically replace the imports for us when we go to deploy depending on the network we are deploying to! That's amazing!

Additionally, we also specify the paths of the contracts (i.e. the location to the .cdc files) based on their names. This will come in handy in the next step!

---

Open up your terminal, pointing to the `flow-name-service` directory, and run the following command:

```shell
flow config add contract
```

We'll start off with `NonFungibleToken`.

1. Enter `NonFungibleToken` for the Name (case-sensitive)
2. Enter `./cadence/contracts/interfaces/NonFungibleToken.cdc` for the Contract File Location (this path is relative to the location of `flow.json`). For Windows users, the cos in contracts will cause an issue so to get around copy `./cadence/ontracts/interfaces/NonFungibleToken.cdc` and then type the missing `c` to complete the path.
3. Press enter (leave blank) the emulator alias for this contract
4. For the Testnet alias, enter `0x631e88ae7f1d7c20` (fetched from the Core Contracts link above)

Awesome! Now do the same for `FungibleToken` and `FlowToken` yourself. Following are the testnet aliases for both of those on the Flow Testnet.

`FungibleToken` = `0x9a0766d93b6608b7`

`FlowToken` = `0x7e60df042a9c0868`

Great! Now, finally, let's also add the path for our own `Domains` contract. For this, we will add no aliases, as it is not a deployed contract. But we will specify it's file location (we will soon see why).

Follow the same steps as above for the contract name `Domains` pointing to the `Domains.cdc` file, but on Step 4, leave blank the Testnet alias for the contract as well.

At this point, you should have a `flow.json` that looks like this:

```json
{
  "emulators": {
    "default": {
      "port": 3569,
      "serviceAccount": "emulator-account"
    }
  },
  "contracts": {
    "Domains": "./cadence/contracts/Domains.cdc",
    "FlowToken": {
      "source": "./cadence/contracts/tokens/FlowToken.cdc",
      "aliases": {
        "emulator": "0x0ae53cb6e3f42a79",
        "testnet": "0x7e60df042a9c0868"
      }
    },
    "FungibleToken": {
      "source": "./cadence/contracts/interfaces/FungibleToken.cdc",
      "aliases": {
        "emulator": "0xee82856bf20e2aa6",
        "testnet": "0x9a0766d93b6608b7"
      }
    },
    "NonFungibleToken": {
      "source": "./cadence/contracts/interfaces/NonFungibleToken.cdc",
      "aliases": {
        "emulator": "0xf8d6e0586b0a20c7",
        "testnet": "0x631e88ae7f1d7c20"
      }
    }
  },
  "networks": {
    "emulator": "127.0.0.1:3569",
    "mainnet": "access.mainnet.nodes.onflow.org:9000",
    "testnet": "access.devnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "emulator-account": {
      "address": "f8d6e0586b0a20c7",
      "key": "2619878f0e2ff438d17835c2a4561cb87b4d24d72d12ec34569acd0dd4af7c21"
    },
    "testnet": {
      "address": "a47932041e18e39a",
      "key": "e31fa3014f4d8400c93c25e1939f24f982b72fa9359433ff06126c40428c7548"
    }
  },
  "deployments": {}
}
```

Notice all the objects added to the `contracts` property within the JSON object. Fabulous!

## ⚙️ Configure the Deployment

Last but not least, we need to configure our deployment. i.e. We need to tell the Flow CLI which contracts we want to deploy as part of our project, and which account should be used for the deployment and for covering gas fees.

In your terminal, again pointing to `flow-name-service` directory, type the following command:

```shell
flow config add deployment
```

1. Choose `testnet` for the Network for Deployment
2. Choose `testnet` for an account to deploy to (This is the account we created earlier)
3. Choose `Domains` for the contract we wish to deploy
4. Choose `No` for 'Do you wish to add another contract for deployment?'

Beautiful. Now, your `flow.json` should look like this:

```json
{
  "emulators": {
    "default": {
      "port": 3569,
      "serviceAccount": "emulator-account"
    }
  },
  "contracts": {
    "Domains": "./cadence/contracts/Domains.cdc",
    "FlowToken": {
      "source": "./cadence/contracts/tokens/FlowToken.cdc",
      "aliases": {
        "emulator": "0x0ae53cb6e3f42a79",
        "testnet": "0x7e60df042a9c0868"
      }
    },
    "FungibleToken": {
      "source": "./cadence/contracts/interfaces/FungibleToken.cdc",
      "aliases": {
        "emulator": "0xee82856bf20e2aa6",
        "testnet": "0x9a0766d93b6608b7"
      }
    },
    "NonFungibleToken": {
      "source": "./cadence/contracts/interfaces/NonFungibleToken.cdc",
      "aliases": {
        "emulator": "0xf8d6e0586b0a20c7",
        "testnet": "0x631e88ae7f1d7c20"
      }
    }
  },
  "networks": {
    "emulator": "127.0.0.1:3569",
    "mainnet": "access.mainnet.nodes.onflow.org:9000",
    "testnet": "access.devnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "emulator-account": {
      "address": "f8d6e0586b0a20c7",
      "key": "2619878f0e2ff438d17835c2a4561cb87b4d24d72d12ec34569acd0dd4af7c21"
    },
    "testnet": {
      "address": "a47932041e18e39a",
      "key": "e31fa3014f4d8400c93c25e1939f24f982b72fa9359433ff06126c40428c7548"
    }
  },
  "deployments": {
    "testnet": {
      "testnet": ["Domains"]
    }
  }
}
```

Notice the object that has been added to the `deployments` property in the JSON object.

## 🚢 Actually Deploy

We're all set to go and SHIP IT!

In your terminal, type the following command:

```shell
flow project deploy --network=testnet
```

You should receive output as such:

```
Deploying 1 contracts for accounts: testnet

Domains -> 0xa47932041e18e39a (1ae58118f34c0f4c9cd32f82d28332d709d306884150b8da1593f6f3ba048be0)


✨ All contracts deployed successfully
```

If you see this, congratulations, you have successfully deployed your contract!

You don't need to worry about storing this contract address, because you can always come back to it and see the address of the `testnet` account in your `flow.json` file! Another reminder that contracts on Flow are deployed to pre-existing accounts, and don't get their own address. A Flow account can hold multiple smart contracts that do different things.

## 💰 Set Prices

As the admin of the Registrar, you need to set the prices for the domains. Nobody will be able to purchase a domain if a price is not set. Therefore, before proceeding, we will utilize the Flow CLI and make a transaction to update prices in the Registrar so our website is actually useable.

Create a file named `setTestPrices.cdc` under `flow-name-service/cadence/transactions` and add the following code to it:

```javascript
import Domains from "../contracts/Domains.cdc"

transaction() {
    let registrar: &Domains.Registrar
    prepare(account: AuthAccount) {
        self.registrar = account.borrow<&Domains.Registrar>(from: Domains.RegistrarStoragePath)
            ?? panic("Could not borrow Registrar")
    }

    execute {
        var len = 1
        while len < 11 {
            self.registrar.setPrices(key: len, val: 0.000001)
            len = len + 1
        }
    }
}
```

For this to work, you must make the transaction from the same account the smart contract has been deployed to.

The Cadence transaction above borrows the `Domains.Registrar` resource from the private storage path of the account. Then, it runs a loop from 1..10 and sets the price for each domain length from 1..10 to be `0.000001` Flow Tokens per second of rental.

This is a fairly decent price to test your app with, considering this implies a 1 year rental comes out to about 31 Flow Tokens overall. The Testnet faucet gives out 1000 tokens at a time, so you'll have enough to play around with multiple domains.

Once you've created this file, open up your terminal and run the following command:

```shell
flow transactions send ./cadence/transactions/setTestPrices.cdc --network=testnet --signer=testnet
```

Wait a few seconds while the transaction is sending, and once it is confirmed, you're good to proceed!

## 🎁 Wrapping Up

Alright, this was hopefully short and sweet. Hopefully you didn't face any errors in deployment. If you did, the most likely reason is a bug in your contract. Hop onto the Discord and share what bug you're facing, and I'll help you debug it!

I'll see you in the next lesson!

To verify this level, please enter the contract account address of the `Domains` contract you have just deployed. Select `Flow Testnet` as the network.

Cheers 🥂
