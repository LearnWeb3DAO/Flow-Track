# Ship your own name service on FLOW - Part 3 - The Website

![](https://i.imgur.com/itcod90.png)

Woohoo! Congratulations on making it this far! 🥳

This is the final piece of the puzzle for building your own Flow Name Service (FNS). We'll build out the full website where users can do the following things:

1. Connect with their Flow Wallet
2. Look at all the registered FNS Domains
3. Purchase a new FNS domain
4. Manage an FNS domain they own
    1. Edit the Bio
    2. Edit the Linked Address
    3. Renew it for longer duration

As always, we will use Next.js to build this out. Hope you're excited!

## 🧹 Pre-Work

Before we set up a new Next.js app, there's one tiny thing we have to do.

You see, GitHub does not push empty folders into a repository. If you have an empty folder inside a Git repo, it will not be pushed to GitHub when you make a commit and push.

When we set up our Flow App using the Flow CLI, it contained an empty folder called `web`. To make sure that GitHub keeps track of the folder, even though it is an empty, the Flow CLI auto-generated a file called `.gitkeep` within the `web` folder. This file tells GitHub to ignore its rules, and let us push an empty folder to GitHub anyway when we want to.

Why am I talking about this? Well, we want to create a Next.js app inside this `web` folder and maintain the project structure the Flow CLI generated for us. Unfortunately, the `create-next-app` tool has problems creating an app in a directory that already has files in it - even if it's literally an empty `.gitkeep`.

So, before we proceed, make sure you delete the `.gitkeep` file in `flow-name-service/web`.

## 👨‍🔬 Setting Up

Open up your terminal and enter the `flow-name-service` directory. Then, run the following command:

```shell
npx create-next-app@latest ./web
```

This will setup a new Next.js project for you within the `web` folder that the Flow CLI set up for us. We now have a fresh web app ready to go!

## 😎 Git Good

The `create-next-app` tool also initializes a Git repo when it sets up the project. However, since we would like to make our parent directory `flow-name-service` a Git repo, we don't want to keep the `web` folder as a separate Git repo to avoid having one Git repo inside another Git repo (Git submodules).

Run the following command in your terminal

```sh
cd web

# Linux / macOS
rm -rf .git

# Windows
rmdir /s /q .git
```

## ⛩ File Structure

The `pages` directory within the `frontend` folder is where we will be doing most of our work. Right now, the `pages` directory should look something like this

```
pages/
├─ api/
│  ├─ hello.js
├─ _app.js
├─ index.js
```

We won't be doing any backend here, so we can get rid of the `api` folder. So go ahead and delete that.

`index.js` is our homepage, and we will use that to display all the registered FNS domains.

Apart from that, create a new file `purchase.js` under `pages`, which will be the Purchase page.

Then, create a directory called `manage` under `pages`, and within it create two files - `index.js` and `[nameHash].js`.

`manage/index.js` will show all the domains owned by the currently logged in user, and they can click on any of them to go to `manage/[nameHash].js` where we will let them update the Bio, Address, or Renew the Domain.

Now, we will also be creating some React components to increase reusability across pages, so we don't write the same code multiple times.

Create a directory named `components` under `web`, and we will add some components here as we go.

Also, we will store all the Flow configuration, Transactions, and Scripts that we write within its own folder. Create a directory named `flow` under `web` and we will start adding things there shortly.

Lastly, create a directory named `contexts` under `web` - this is where we will create a React Context (a way to share state variables and other code across pages and components) to store data about our currently logged in user.

By the end, you should have a structure that looks like this:

```
components/
contexts/
flow/
pages/
├─ [manage]/
│  ├─ index.js
│  ├─ [nameHash].js
├─ _app.js
├─ purchase.js
├─ index.js
```

## 💰 Flow Client Library (FCL)

We will use the [Flow Client Library](https://docs.onflow.org/fcl/) for handling wallet connection, running scripts, sending transactions, etc across the entire application.

Run the following command in your terminal to install the dependency required:

```shell
npm install @onflow/fcl
```

## ⚙️ Configuring the FCL
Create a file named `config.js` under `web/flow` directory. Here we will specify configuration for the Flow Client Library to use for a few different things.

Add the following code to it:

```javascript
import { config } from "@onflow/fcl";

config({
  // The name of our dApp to show when connecting to a wallet
  "app.detail.title": "Flow Name Service",
  // An image to use as the icon for our dApp when connecting to a wallet
  "app.detail.icon": "https://placekitten.com/g/200/200",
  // RPC URL for the Flow Testnet
  "accessNode.api": "https://rest-testnet.onflow.org",
  // A URL to discover the various wallets compatible with this network
  // FCL automatically adds support for all wallets which support Testnet
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  // Alias for the Domains Contract
  // UPDATE THIS to be the address of YOUR contract account address
  "0xDomains": "UPDATE_ME",
  // Testnet aliases for NonFungibleToken and FungibleToken contracts
  "0xNonFungibleToken": "0x631e88ae7f1d7c20",
  "0xFungibleToken": "0x9a0766d93b6608b7",
});

```

**MAKE SURE** you update the contract alias for `0xDomains` otherwise your website will not work. We will see how this alias works in a bit.

<Quiz questionId="d943aaa7-0d07-42e8-921c-6770029cca3d" />

## 🎬 Account Initialization
If you remember from Part 1, I mentioned that the `createEmptyCollection` global function on our smart contract will be used to initialize user accounts who wish to purchase FNS domains.

We already initialized the smart contract / admin account during the contract initializer. However, all other users who want to buy FNS domains, must first initialize an empty collection in the requisite storage paths in their own accounts.

Therefore, we need two things:
1. A script that can check whether or not a user's account is already initialized
2. A transaction that can initialize their account for them, if necessary

---

Create a file `scripts.js` under `web/flow` directory. Add the following code to it:

```javascript
import * as fcl from "@onflow/fcl";

export async function checkIsInitialized(addr) {
  return fcl.query({
    cadence: IS_INITIALIZED,
    args: (arg, t) => [arg(addr, t.Address)],
  });
}

const IS_INITIALIZED = `
import Domains from 0xDomains
import NonFungibleToken from 0xNonFungibleToken

pub fun main(account: Address): Bool {
    let capability = getAccount(account).getCapability<&Domains.Collection{NonFungibleToken.CollectionPublic, Domains.CollectionPublic}>(Domains.DomainsPublicPath)
    return capability.check()
}
`;
```

There's a few different things to learn from this snippet of code.

Let's first look at the `IS_INITIALIZED` Cadence Script. Notice the imports. Instead of importing from addresses, we are importing contracts from `0xDomains` and `0xNonFungibleToken` respectively. This is done not only for readability purposes, but also so that you can write the scripts once and have them work across multiple networks that your dApp might support - for example Testnet and Mainnet versions.

The aliases for these were defined earlier when we configured the `config.js` file for FCL.

As for the script itself, it just attempts to borrow a public capability from the given account address for `Domains.Collection`. `capability.check()` returns `true` or `false` depending on whether or not that resource exists at the given public path. If it does, that means the user's account has already been initialized. If it does not, then we will ask them to initialize it through a transaction.

Lastly, let's look at the function we are exporting. Two things to notice there:
1. The `fcl.query` syntax
2. The `args: (arg, t) => [arg(addr, t.Address)],` line

FCL offers two main methods of interacting with the blockchain. `fcl.query` and `fcl.mutate`. Since Scripts are akin to `view` functions in Solidity and don't require any gas fees to run, we are essentially just querying the blockchain. So we use `fcl.query` to run Scripts. `fcl.mutate`, as we will see right after this, is used to make transactions to the blockchain that modify the state.

As for the arguments, since our script requires an `account` argument to be passed for it, we need to encode our string version of the address into something the Flow network and Cadence can understand. We do this using the `(arg, t)` helper values given to us.

`arg` is a function that takes a string value representing the argument, in this case the address. `t` is an object that contains all the different data types that Cadence has, so we can tell `arg` how to encode/decode the argument we are giving.

In this case, we are giving the string `addr` and telling FCL to encode it as the type `Address` by using `t.Address`

All of this will become second-nature as we write more and more scripts and transactions for our app.

<Quiz questionId="9f9e8ffe-b4a7-4293-9bb2-d2eb571e9e2f" />

<Quiz questionId="3b8d4477-6201-44bd-a34c-b0fbf383fb4c" />

<Quiz questionId="ee6fc2e6-3b00-477c-a3f8-e48349574459" />

---

Now, create a file called `transactions.js` under `web/flow` directory. Here we will write the transaction for initializing an account.

Add the following code to the file:

```javascript
import * as fcl from "@onflow/fcl";

export async function initializeAccount() {
  return fcl.mutate({
    cadence: INIT_ACCOUNT,
    payer: fcl.authz,
    proposer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 50,
  });
}

const INIT_ACCOUNT = `
import Domains from 0xDomains
import NonFungibleToken from 0xNonFungibleToken

transaction() {
    prepare(account: AuthAccount) {
        account.save<@NonFungibleToken.Collection>(<- Domains.createEmptyCollection(), to: Domains.DomainsStoragePath)
        account.link<&Domains.Collection{NonFungibleToken.CollectionPublic, NonFungibleToken.Receiver, Domains.CollectionPublic}>(Domains.DomainsPublicPath, target: Domains.DomainsStoragePath)
        account.link<&Domains.Collection>(Domains.DomainsPrivatePath, target: Domains.DomainsStoragePath)
    }
}
`;
```

In the `INIT_ACCOUNT` Cadence Transaction, we are basically doing what we did for the admin account in the `Domains` contract constructor. Creating a new empty `Domains.Collection` using `createEmptyCollection`, saving it in the user's account storage path, and linking the respective Public and Private portions of it to the Public and Private storage paths.

As for the function, you will notice the `fcl.mutate` syntax is basically the same as `fcl.query`. However, we do provide a few extra parameters.

Specifically, these:

```
payer: fcl.authz,
proposer: fcl.authz,
authorizations: [fcl.authz],
limit: 50,
```

These are Flow-specific things that define which account will be paying for the transaction (payer), broadcasting the transaction (proposer), and which accounts we need authorizations from (in case an account has mutliple keys attached, it can behave like a multisig wallet). In our case, things are simpler, and all of them are the same. `fcl.authz` refers to the currently connected account. In all the future transactions we write, all these properties will remain the same.

`limit` is like `gasLimit` in the Ethereum world, which places an upper-limit on how much computation we want to let this function call do at most, and if the computation crosses the limit then the transaction will fail.

<Quiz questionId="d198a9bd-89f4-49fd-a9a0-ad065abc3128" />

## 🔐 Creating the AuthContext

To avoid re-writing code across multiple pages, and share information across pages and components about the currently logged in user and such, we will be writing a React context.

Create a file named `AuthContext.js` under the `web/contexts` folder that we created.

I'll break this into chunks to make it easier to understand, as it might be the first time a lot of you are writing React contexts. I will try to explain the best I can. However, for a depper explanation, I suggest you look at [React Contexts Explained](https://www.youtube.com/watch?v=rFnfvhtrNbQ).

Add the following bits of code first of all:

```javascript
import * as fcl from "@onflow/fcl";
import { createContext, useContext, useEffect, useState } from "react";
import { checkIsInitialized, IS_INITIALIZED } from "../flow/scripts";

export const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);
```

Note that we first create `AuthContext` using React's inbuilt `createContext` function. We set the initial value to be an empty object `{}`.

We then export a custom React Hook - `useAuth` - that is really just `useContext(AuthContext)`. This is for readability purposes. We could have chosen not to do this and write `useContext(AuthContext)` ourselves everywhere, but that's not cool.

In a nutshell, a Context basically has two things you need to know about. A Context Provider, and the context value.

The Context value is some data that will be made accessible to all components/pages who want it using the `useAuth` hook. We will specifically use it to share information around the currently logged in user's address, and whether or not their account has been initialized. Additionally, we will also expose helper functions to `logIn` and `logOut` of the Flow wallet.

The Context Provider is a React component. We will wrap all of our own components and pages inside the Context Provider React Component, which will make the Context Value available to all the components present inside the Provider component. If this sounds a bit confusing, I highly suggest watching the video I linked above - though this will also get clearer as we write the code for it.

Now, add the following code to the file as well:

```javascript
export default function AuthProvider({ children }) {

  // Create a state variable to keep track of the currentUser
  const [currentUser, setUser] = useState({
    loggedIn: false,
    addr: undefined,
  });
  // Create a state variable to represent if a user's account
  // has been initialized or not
  const [isInitialized, setIsInitialized] = useState(false);

  // Use FCL to subscribe to changes in the user (login, logout, etc)
  // Tell FCL to call `setUser` and update our state variables
  // if anything changes
  useEffect(() => fcl.currentUser.subscribe(setUser), []);

  // If currentUser is set, i.e. user is logged in
  // check whether their account is initialized or not
  useEffect(() => {
    if (currentUser.addr) {
      checkInit();
    }
  }, [currentUser]);

  // Helper function to log the user out of the dApp
  const logOut = async () => {
    fcl.unauthenticate();
    setUser({ loggedIn: false, addr: undefined });
  };

  // Helper function to log the user in to the dApp
  // p.s. this feels even easier than RainbowKit, eh?
  const logIn = () => {
    fcl.logIn();
  };

  // Use the `checkIsInitialized` script we wrote earlier
  // and update the state variable as necessary
  const checkInit = async () => {
    const isInit = await checkIsInitialized(currentUser.addr);
    setIsInitialized(isInit);
  };

  // Build the object of everything we want to expose through 
  // the context
  const value = {
    currentUser,
    isInitialized,
    checkInit,
    logOut,
    logIn,
  };

  // Return the Context Provider with the value set
  // Render all children of the component inside of it
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

Hopefully the comments in the code are sufficient to explain what is going on. Feel free to message on Discord and I'll help you out if you have any doubts! However, if those doubts are primarily related to how React Contexts work, I highly suggest again you go look at the video I linked above first!

<Quiz questionId="a8f16337-b84e-4f89-adfe-744bb7c591fb" />

## 💉 Injecting the AuthContext

As I mentioned, the Context Value is only available to the pages/components that are wrapped inside the Context Provider. Since we would like to share this context throughout our entire app, we can just add the Context Provider in the `_app.js` file which is the core file used in Next.js used to render all pages of our webapp.

If you've used RainbowKit (perhaps in the Celo track), this is very similar to wrapping the RainbowKit Provider and the WAGMI Provider around the entire application.

Open up `_app.js` and modify the `MyApp` component there to look like this:

```jsx
import AuthProvider from "../contexts/AuthContext";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;
```

You see how we 'wrapped' the `<Component />` tag inside `<AuthProvider>`? The `Component` tag is really all the pages in our application. Therefore, our Context Provider is now wrapped around all the Pages in our application, and by extension, all the components we will use inside those pages.

Fantabulous!

## 🗺 Building the Navbar

Create a file called `Navbar.js` under `web/components` directory. Here, we will provide navigation for the user to switch between pages, and also a way to Login/Logout from the application.

Add the following code to that file:

```jsx
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import "../flow/config";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  // Use the AuthContext to get values for the currentUser
  // and helper functions for logIn and logOut
  const { currentUser, logOut, logIn } = useAuth();

  return (
    <div className={styles.navbar}>
      <Link href="/">Home</Link>
      <Link href="/purchase">Purchase</Link>
      <Link href="/manage">Manage</Link>
      <button onClick={currentUser.addr ? logOut : logIn}>
        {currentUser.addr ? "Log Out" : "Login"}
      </button>
    </div>
  );
}
```

This is not a CSS tutorial, nor this platform is for learning CSS, so I won't go into how this works - but if you want to make things look a little pretty, copy paste the following CSS code into a new file called `Navbar.module.css` created under `web/styles` directory.

```css
.navbar {
  display: flex;
  justify-content: center;
  column-gap: 2em;
  align-items: center;
  background-color: #171923;
  padding: 1em 0 1em 0;
  font-size: 16px;
  border-bottom: 2px solid darkslategray;
  margin-bottom: 2em;
}

.navbar a {
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 8px;
  color: white;
}

.navbar button {
  padding: 8px;
  background-color: transparent;
  border: 2px solid transparent;
  border-radius: 10px;
  color: white;
  font: inherit;
}

.navbar a:hover,
.navbar button:hover {
  border: 2px solid darkslategray;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
}
```

## 🏠 Building the Homepage

Recall that the Homepage is going to be used to display all the registered FNS domains till date. Before we start coding the frontend part of it, let's first create a Cadence script to fetch all the domains that have been registered and all their properties.

Open up `scripts.js` inside `web/flow` directory, and add the following code there:

```javascript
export async function getAllDomainInfos() {
  return fcl.query({
    cadence: GET_ALL_DOMAIN_INFOS,
  });
}

const GET_ALL_DOMAIN_INFOS = `
import Domains from 0xDomains

pub fun main(): [Domains.DomainInfo] {
    let allOwners = Domains.getAllOwners()
    let infos: [Domains.DomainInfo] = []

    for nameHash in allOwners.keys {
        let publicCap = getAccount(allOwners[nameHash]!).getCapability<&Domains.Collection{Domains.CollectionPublic}>(Domains.DomainsPublicPath)
        let collection = publicCap.borrow()!
        let id = Domains.nameHashToIDs[nameHash]
        if id != nil {
            let domain = collection.borrowDomain(id: id!)
            let domainInfo = domain.getInfo()
            infos.append(domainInfo)
        }
    }

    return infos
}
`;
```

The function we wrote here isn't particularly interesting, but the Cadence script is. Let's take a look at that.

Remember the `DomainInfo` struct we defined in our contract? Our script will return an array of `DomainInfo` structs whose data we can use to display all domains on our homepage.

So, first, we fetch all the owners and the domains that they own by calling `Domains.getAllOwners()`. This gives us a dictionary of (nameHash -> owner).

Then we create an empty array that we will push to, and later return from the script.

We then loop over each entry in the dictionary, keeping track of the nameHash

We fetch the public capability of `Domains.Collection` from the account which owns the given domain in the current iteration of the loop, borrow a reference to the public portion of `Domains.Collection`, and use the `nameHashToIDs` dictionary to get the ID of the Domain NFT we are interested in.

Then, we use the public `borrowDomain` function on the `Domains.Collection` resource to borrow a reference to the `Domain.NFT` resource, and finally use the public function `getInfo()` to get its `DomainInfo` struct. We push this struct into our array, and move on to the next domain.

At the end of the loop, we return the array we have built up. Great!

---

Open up `pages/index.js` within the `web` directory, and delete all the pre-existing boilerplate code that `create-next-app` generated for you there.

Replace it with the following code, and read the code comments to understand what is going on:

```jsx
import Head from "next/head";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getAllDomainInfos } from "../flow/scripts";
import styles from "../styles/Home.module.css";

export default function Home() {
  // Create a state variable for all the DomainInfo structs
  // Initialize it to an empty array
  const [domainInfos, setDomainInfos] = useState([]);

  // Load all the DomainInfo's by running the Cadence script
  // when the page is loaded
  useEffect(() => {
    async function fetchDomains() {
      const domains = await getAllDomainInfos();
      setDomainInfos(domains);
    }

    fetchDomains();
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>
        <h1>All Registered Domains</h1>

        <div className={styles.domainsContainer}>
          {
            // If no domains were found, display a message highlighting that
            domainInfos.length === 0 ? (
            <p>No FNS Domains have been registered yet</p>
          ) : (
            // Otherwise, loop over the array, and render information
            // about each domain
            domainInfos.map((di, idx) => (
              <div className={styles.domainInfo} key={idx}>
                <p>
                  {di.id} - {di.name}
                </p>
                <p>Owner: {di.owner}</p>
                <p>Linked Address: {di.address ? di.address : "None"}</p>
                <p>Bio: {di.bio ? di.bio : "None"}</p>
                <!-- Parse the timestamps as human-readable dates -->
                <p>
                  Created At:{" "}
                  {new Date(parseInt(di.createdAt) * 1000).toLocaleDateString()}
                </p>
                <p>
                  Expires At:{" "}
                  {new Date(parseInt(di.expiresAt) * 1000).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

```

While this is not a CSS tutorial, just to make things look somewhat pretty, open up `styles/Home.module.css` and copy-paste the following code there (replacing the original boilerplate code):

```css
.container {
  background-color: #171923;
  min-height: 100vh;
}

.main {
  color: white;
  padding: 0 4em;
}

.domainsContainer {
  display: flex;
  gap: 4em;
  flex-wrap: wrap;
}

.domainInfo {
  padding: 2em;
  color: antiquewhite;
  background-color: darkslategray;
  border-radius: 2em;
  max-width: 65ch;
}
```

I will not be explaining how the CSS is working as that is not the focus of this course or this platform.

## 🤝 Building the Purchase Page

Before we let the user purchase anything, we must make sure the user's account has been initialized.

--- 

Considering it is, we need to write two things now:
1. A Cadence script that calls `getRentCost` to predict the cost of the domain
2. A Cadence script that calls `isAvailable` to check if a domain name is available
3. A Cadence transaction that will call `registerDomain` to then buy it

Open up `scripts.js` under `web/flow` directory again, and add the following code to it:

```javascript
export async function checkIsAvailable(name) {
  return fcl.query({
    cadence: CHECK_IS_AVAILABLE,
    args: (arg, t) => [arg(name, t.String)],
  });
}

const CHECK_IS_AVAILABLE = `
import Domains from 0xDomains

pub fun main(name: String): Bool {
  return Domains.isAvailable(nameHash: name)
}
`;

export async function getRentCost(name, duration) {
  return fcl.query({
    cadence: GET_RENT_COST,
    args: (arg, t) => [arg(name, t.String), arg(duration, t.UFix64)],
  });
}

const GET_RENT_COST = `
import Domains from 0xDomains

pub fun main(name: String, duration: UFix64): UFix64 {
  return Domains.getRentCost(name: name, duration: duration)
}
`;

```

By this point, you should be noticing patterns in how these scripts and transactions are written. This is a fairly simple one for that matter, so I'll leave it to you to understand what's happening. Feel free to ask on Discord if you don't get it though.

Now, open up `transactions.js` under `web/flow` directory again as well, and add the following code to it:

```javascript
export async function registerDomain(name, duration) {
  return fcl.mutate({
    cadence: REGISTER_DOMAIN,
    args: (arg, t) => [arg(name, t.String), arg(duration, t.UFix64)],
    payer: fcl.authz,
    proposer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 1000,
  });
}

const REGISTER_DOMAIN = `
import Domains from 0xDomains
import FungibleToken from 0xFungibleToken
import NonFungibleToken from 0xNonFungibleToken

transaction(name: String, duration: UFix64) {
    let nftReceiverCap: Capability<&{NonFungibleToken.Receiver}>
    let vault: @FungibleToken.Vault
    prepare(account: AuthAccount) {
        self.nftReceiverCap = account.getCapability<&{NonFungibleToken.Receiver}>(Domains.DomainsPublicPath)
        let vaultRef = account.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault) ?? panic("Could not borrow Flow token vault reference")
        let rentCost = Domains.getRentCost(name: name, duration: duration)
        self.vault <- vaultRef.withdraw(amount: rentCost)
    }
    execute {
        Domains.registerDomain(name: name, duration: duration, feeTokens: <- self.vault, receiver: self.nftReceiverCap)
    }
}
`;
```

This transaction is a little more involved, so I'll explain the Cadence code here.

Recall that for `registerDomain` we need access to a capability for `NonFungibleToken.Receiver` to actually be able to deposit the minted `Domain.NFT` resource into the user's collection.

So first, we attempt to get the capability from the user's public `Domains.Collection` path for `NonFungibleToken.Receiver`. If their account has not been initialized yet, this code will throw an error.

Also recall that for `registerDomain` the user is responsible for paying in Flow tokens, so we need to send a reference to a vault to the smart contract with the appropriate amount of Flow tokens in it for the contract to deposit into its own `rentVault`.

So we borrow a `FungibleToken.Vault` from `/storage/flowTokenVault` which is the storage path for Flow Tokens. We calculate the rent cost for the domain name we wish to purchase, and then withdraw the requisite amount from our Storage Vault into a new temporary vault.

Then, we call `Domains.registerDomain` and pass the `name`, `duration`, as well as the `vault` which contains the payment, and the `receiver` which is the `NonFungibleToken.Receiver` capability to the contract and let it do its magic.

<Quiz questionId="f725310a-c854-443b-9b3c-e937bb708218" />

---

Coming back to the website now, open up `pages/purchase.js`. Read the code comments to understand what is happening.

```jsx
import * as fcl from "@onflow/fcl";
import { useEffect, useState } from "react";
import Head from "next/head";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { checkIsAvailable, getRentCost } from "../flow/scripts";
import { initializeAccount, registerDomain } from "../flow/transactions";
import styles from "../styles/Purchase.module.css";

// Maintain a constant for seconds per year
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export default function Purchase() {
  // Use the AuthContext to check whether the connected user is initialized or not
  const { isInitialized, checkInit } = useAuth();
  // State Variable to keep track of the domain name the user wants
  const [name, setName] = useState("");
  // State variable to keep track of how many years 
  // the user wants to rent the domain for
  const [years, setYears] = useState(1);
  // State variable to keep track of the cost of this purchase
  const [cost, setCost] = useState(0.0);
  // Loading state
  const [loading, setLoading] = useState(false);

  // Function to initialize a user's account if not already initialized
  async function initialize() {
    try {
      const txId = await initializeAccount();
        
      // This method waits for the transaction to be mined (sealed)
      await fcl.tx(txId).onceSealed();
      // Recheck account initialization after transaction goes through
      await checkInit();
    } catch (error) {
      console.error(error);
    }
  }

  // Function which calls `registerDomain` 
  async function purchase() {
    try {
      setLoading(true);
      const isAvailable = await checkIsAvailable(name);
      if (!isAvailable) throw new Error("Domain is not available");

      if (years <= 0) throw new Error("You must rent for at least 1 year");
      const duration = (years * SECONDS_PER_YEAR).toFixed(1).toString();
      const txId = await registerDomain(name, duration);
      await fcl.tx(txId).onceSealed();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which calculates cost of purchase as user 
  // updates the name and duration
  async function getCost() {
    if (name.length > 0 && years > 0) {
      const duration = (years * SECONDS_PER_YEAR).toFixed(1).toString();
      const c = await getRentCost(name, duration);
      setCost(c);
    }
  }

  // Call getCost() every time `name` and `years` changes
  useEffect(() => {
    getCost();
  }, [name, years]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service - Purchase</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      {!isInitialized ? (
        <>
          <p>Your account has not been initialized yet</p>
          <button onClick={initialize}>Initialize Account</button>
        </>
      ) : (
        <main className={styles.main}>
          <div className={styles.inputGroup}>
            <span>Name: </span>
            <input
              type="text"
              value={name}
              placeholder="learnweb3"
              onChange={(e) => setName(e.target.value)}
            />
            <span>.fns</span>
          </div>

          <div className={styles.inputGroup}>
            <span>Duration: </span>
            <input
              type="number"
              placeholder="1"
              value={years}
              onChange={(e) => setYears(e.target.value)}
            />
            <span>years</span>
          </div>
          <button onClick={purchase}>Purchase</button>
          <p>Cost: {cost} FLOW</p>
          <p>{loading ? "Loading..." : null}</p>
        </main>
      )}
    </div>
  );
}

```

<Quiz questionId="55a34d46-5e92-4369-b922-4ee3ab24a67b" />

Awesome! Create a CSS file named `Purchase.module.css` under `pages/styles` and copy over the following code there:

```css
.container {
  background-color: #171923;
  min-height: 100vh;
}

.main {
  color: white;
  padding: 0 4em;
  display: flex;
  gap: 2em;
  flex-direction: column;
  width: 30%;
  margin: auto;
  align-items: center;
}

.inputGroup {
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.inputGroup input {
  padding: 0.2em;
  border-radius: 0.5em;
  border-width: 0;
}

.main button {
  width: fit-content;
}
```

## 🧑‍💼 Building the Manage Page

We are close to being done. On the Manage page, the user must be presented with all the domains they currently own - and they can click on them to modify attributes of that specific Domain.

Therefore, we need to write a Cadence script that fetches all the domains owned by the connected user.

Open up `scripts.js` in `web/flow` again, and add the following code there:

```javascript
export async function getMyDomainInfos(addr) {
  return fcl.query({
    cadence: GET_MY_DOMAIN_INFOS,
    args: (arg, t) => [arg(addr, t.Address)],
  });
}

const GET_MY_DOMAIN_INFOS = `
import Domains from 0xDomains
import NonFungibleToken from 0xNonFungibleToken

pub fun main(account: Address): [Domains.DomainInfo] {
    let capability = getAccount(account).getCapability<&Domains.Collection{NonFungibleToken.CollectionPublic, Domains.CollectionPublic}>(Domains.DomainsPublicPath)
    let collection = capability.borrow() ?? panic("Collection capability could not be borrowed")

    let ids = collection.getIDs()
    let infos: [Domains.DomainInfo] = []

    for id in ids {
        let domain = collection.borrowDomain(id: id!)
        let domainInfo = domain.getInfo()
        infos.append(domainInfo)
    }

    return infos
}
`;
```

This code is quite similar to the script we used for the Homepage, except instead of tracking all owners and getting DomainInfos for each NFT for each owner, we only get info for each NFT for the given address.

We borrow the public capability of the given address, fetch all the IDs of Domains owned by that user in his collection, and then `getInfo()` for all of them.

Now, open up `pages/manage/index.js` within `web` directory, and add the following code there:

```jsx
import * as fcl from "@onflow/fcl";
import Head from "next/head";
import Link from "next/link";
import {useEffect, useState} from "react";
import Navbar from "../../components/Navbar";
import {useAuth} from "../../contexts/AuthContext";
import {getMyDomainInfos} from "../../flow/scripts";
import {initializeAccount} from "../../flow/transactions";
import styles from "../../styles/Manage.module.css";

export default function Home() {
  // Use the AuthContext to track user data
  const { currentUser, isInitialized, checkInit } = useAuth();
  const [domainInfos, setDomainInfos] = useState([]);

  // Function to initialize the user's account if not already initialized
  async function initialize() {
    try {
      const txId = await initializeAccount();
      await fcl.tx(txId).onceSealed();
      await checkInit();
    } catch (error) {
      console.error(error);
    }
  }

  // Function to fetch the domains owned by the currentUser
  async function fetchMyDomains() {
    try {
      const domains = await getMyDomainInfos(currentUser.addr);
      setDomainInfos(domains);
    } catch (error) {
      console.error(error.message);
    }
  }

  // Load user-owned domains if they are initialized
  // Run if value of `isInitialized` changes
  useEffect(() => {
    if (isInitialized) {
      fetchMyDomains();
    }
  }, [isInitialized]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service - Manage</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>
        <h1>Your Registered Domains</h1>

        {!isInitialized ? (
          <>
            <p>Your account has not been initialized yet</p>
            <button onClick={initialize}>Initialize Account</button>
          </>
        ) : (
          <div className={styles.domainsContainer}>
            {domainInfos.length === 0 ? (
              <p>You have not registered any FNS Domains yet</p>
            ) : (
              domainInfos.map((di, idx) => (
                <Link href={`/manage/${di.nameHash}`}>
                  <div className={styles.domainInfo} key={idx}>
                    <p>
                      {di.id} - {di.name}
                    </p>
                    <p>Owner: {di.owner}</p>
                    <p>Linked Address: {di.address ? di.address : "None"}</p>
                    <p>Bio: {di.bio ? di.bio : "None"}</p>
                    <p>
                      Created At:{" "}
                      {new Date(
                        parseInt(di.createdAt) * 1000
                      ).toLocaleDateString()}
                    </p>
                    <p>
                      Expires At:{" "}
                      {new Date(
                        parseInt(di.expiresAt) * 1000
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

```

Also, create a CSS file called `Manage.module.css` under `web/styles` directory, and copy over the following CSS code to it:

```css
.container {
  background-color: #171923;
  min-height: 100vh;
}

.main {
  color: white;
  padding: 0 4em;
}

.domainsContainer {
  display: flex;
  gap: 4em;
  flex-wrap: wrap;
}

.domainInfo {
  padding: 2em;
  color: antiquewhite;
  background-color: darkslategray;
  border-radius: 2em;
  cursor: pointer;
  max-width: 65ch;
}
```

## 🎉 Building the Manage Page for a Domain

This is the LAST thing left to do! We're basically done at this point!

To manage a specific domain, we need to do a few things though:

1. Write a Cadence script that can fetch DomainInfo for a given domain using its `nameHash`
2. Write a Cadence transaction that updates the bio for a user's domain
3. Write a Cadence transaction that updates the linked address for a user's domain
4. Write a Cadence transaction that renews the domain

First, let's open up `scripts.js` in `web/flow`, and add the following code there:

```javascript
export async function getDomainInfoByNameHash(addr, nameHash) {
  return fcl.query({
    cadence: GET_DOMAIN_BY_NAMEHASH,
    args: (arg, t) => [arg(addr, t.Address), arg(nameHash, t.String)],
  });
}

const GET_DOMAIN_BY_NAMEHASH = `
import Domains from 0xDomains
import NonFungibleToken from 0xNonFungibleToken

pub fun main(account: Address, nameHash: String): Domains.DomainInfo {
  let capability = getAccount(account).getCapability<&Domains.Collection{NonFungibleToken.CollectionPublic, Domains.CollectionPublic}>(Domains.DomainsPublicPath)
  let collection = capability.borrow() ?? panic("Collection capability could not be borrowed")

  let id = Domains.nameHashToIDs[nameHash]
  if id == nil {
    panic("Domain not found")
  }

  let domain = collection.borrowDomain(id: id!)
  let domainInfo = domain.getInfo()
  return domainInfo
}
`;
```

Once again very similar to what we had on the Manage page, except now we are only interested in getting the `DomainInfo` for one specific domain.

Now, let's open up `transactions.js` under `web/flow` - and we'll go function by function.

First, add this code:

```javascript
export async function updateBioForDomain(nameHash, bio) {
  return fcl.mutate({
    cadence: UPDATE_BIO_FOR_DOMAIN,
    args: (arg, t) => [arg(nameHash, t.String), arg(bio, t.String)],
    payer: fcl.authz,
    proposer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 1000,
  });
}

const UPDATE_BIO_FOR_DOMAIN = `
import Domains from 0xDomains

transaction(nameHash: String, bio: String) {
    var domain: &{Domains.DomainPrivate}
    prepare(account: AuthAccount) {
        var domain: &{Domains.DomainPrivate}? = nil
        let collectionPvt = account.borrow<&{Domains.CollectionPrivate}>(from: Domains.DomainsStoragePath) ?? panic("Could not load collection private")

        let id = Domains.nameHashToIDs[nameHash]
        if id == nil {
            panic("Could not find domain")
        }

        domain = collectionPvt.borrowDomainPrivate(id: id!)
        self.domain = domain!
    }
    execute {
        self.domain.setBio(bio: bio)
    }
}
`;
```

This code first attempts to borrow the private portion of `Domains.Collection` from the user's private path. It then uses `borrowDomainPrivate` to get a full reference to the `Domain.NFT` resource within the collection, and then calls the `setBio` function on it to update the bio to be what was provided by the user.

Very similarly, add the following code which updates the linked address to the domain:

```javascript
export async function updateAddressForDomain(nameHash, addr) {
  return fcl.mutate({
    cadence: UPDATE_ADDRESS_FOR_DOMAIN,
    args: (arg, t) => [arg(nameHash, t.String), arg(addr, t.Address)],
    payer: fcl.authz,
    proposer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 1000,
  });
}

const UPDATE_ADDRESS_FOR_DOMAIN = `
import Domains from 0xDomains

transaction(nameHash: String, addr: Address) {
    var domain: &{Domains.DomainPrivate}
    prepare(account: AuthAccount) {
        var domain: &{Domains.DomainPrivate}? = nil
        let collectionPvt = account.borrow<&{Domains.CollectionPrivate}>(from: Domains.DomainsStoragePath) ?? panic("Could not load collection private")

        let id = Domains.nameHashToIDs[nameHash]
        if id == nil {
            panic("Could not find domain")
        }

        domain = collectionPvt.borrowDomainPrivate(id: id!)
        self.domain = domain!
    }
    execute {
        self.domain.setAddress(addr: addr)
    }
}
`;
```

This is pretty much identicatal to the above code, except it calls `setAddress` instead of `setBio`.

Lastly, add the following code for renewing a domain:

```javascript
export async function renewDomain(name, duration) {
  return fcl.mutate({
    cadence: RENEW_DOMAIN,
    args: (arg, t) => [arg(name, t.String), arg(duration, t.UFix64)],
    payer: fcl.authz,
    proposer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 1000,
  });
}

const RENEW_DOMAIN = `
import Domains from 0xDomains
import FungibleToken from 0xFungibleToken
import NonFungibleToken from 0xNonFungibleToken

transaction(name: String, duration: UFix64) {
  let vault: @FungibleToken.Vault
  var domain: &Domains.NFT
  prepare(account: AuthAccount) {
      let collectionRef = account.borrow<&{Domains.CollectionPublic}>(from: Domains.DomainsStoragePath) ?? panic("Could not borrow collection public")
      var domain: &Domains.NFT? = nil
      let collectionPrivateRef = account.borrow<&{Domains.CollectionPrivate}>(from: Domains.DomainsStoragePath) ?? panic("Could not borrow collection private")

      let nameHash = Domains.getDomainNameHash(name: name)
      let domainId = Domains.nameHashToIDs[nameHash]
      log(domainId)
      if domainId == nil {
          panic("You don't own this domain")
      }

      domain = collectionPrivateRef.borrowDomainPrivate(id: domainId!)
      self.domain = domain!
      let vaultRef = account.borrow<&FungibleToken.Vault>(from: /storage/flowTokenVault) ?? panic("Could not borrow Flow token vault reference")
      let rentCost = Domains.getRentCost(name: name, duration: duration)
      self.vault <- vaultRef.withdraw(amount: rentCost)
  }
  execute {
      Domains.renewDomain(domain: self.domain, duration: duration, feeTokens: <- self.vault)
  }
}
`;
```

This one is more fun. `renewDomain` requires a full reference to the `Domain.NFT` resource, and also requires a `FungibleToken.Vault` similar to `registerDomain`.

So the first half of this code, getting a full reference to `Domain.NFT`, is similar to what we did for updating the bio and the address.

Once we have that, then the second half is similar to what we did for `registerDomain`, where we borrow access to the `FungibleToken.Vault` and create a new vault with the appropriate amount of tokens depending on cost of the domain renewal.

Finally, we call `Domains.renewDomain` in the smart contract and let it work its magic.

---

Now for the website part of things, open up `pages/manage/[nameHash.js]` and add the following code there:

```jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import * as fcl from "@onflow/fcl";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import { getDomainInfoByNameHash, getRentCost } from "../../flow/scripts";
import styles from "../../styles/ManageDomain.module.css";
import {
  renewDomain,
  updateAddressForDomain,
  updateBioForDomain,
} from "../../flow/transactions";

// constant representing seconds per year
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export default function ManageDomain() {
  // Use AuthContext to gather data for current user
  const { currentUser, isInitialized } = useAuth();

  // Next Router to get access to `nameHash` query parameter
  const router = useRouter();
  // State variable to store the DomainInfo
  const [domainInfo, setDomainInfo] = useState();
  // State variable to store the bio given by user
  const [bio, setBio] = useState("");
  // State variable to store the address given by user
  const [linkedAddr, setLinkedAddr] = useState("");
  // State variable to store how many years to renew for
  const [renewFor, setRenewFor] = useState(1);
  // Loading state
  const [loading, setLoading] = useState(false);
  // State variable to store cost of renewal
  const [cost, setCost] = useState(0.0);

    
  // Function to load the domain info
  async function loadDomainInfo() {
    try {
      const info = await getDomainInfoByNameHash(
        currentUser.addr,
        router.query.nameHash
      );
      console.log(info);
      setDomainInfo(info);
    } catch (error) {
      console.error(error);
    }
  }

  // Function which updates the bio transaction
  async function updateBio() {
    try {
      setLoading(true);
      const txId = await updateBioForDomain(router.query.nameHash, bio);
      await fcl.tx(txId).onceSealed();
      await loadDomainInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which updates the address transaction
  async function updateAddress() {
    try {
      setLoading(true);
      const txId = await updateAddressForDomain(
        router.query.nameHash,
        linkedAddr
      );
      await fcl.tx(txId).onceSealed();
      await loadDomainInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which runs the renewal transaction
  async function renew() {
    try {
      setLoading(true);
      if (renewFor <= 0)
        throw new Error("Must be renewing for at least one year");
      const duration = (renewFor * SECONDS_PER_YEAR).toFixed(1).toString();
      const txId = await renewDomain(
        domainInfo.name.replace(".fns", ""),
        duration
      );
      await fcl.tx(txId).onceSealed();
      await loadDomainInfo();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Function which calculates cost of renewal
  async function getCost() {
    if (domainInfo && domainInfo.name.replace(".fns", "").length > 0 && renewFor > 0) {
      const duration = (renewFor * SECONDS_PER_YEAR).toFixed(1).toString();
      const c = await getRentCost(
        domainInfo.name.replace(".fns", ""),
        duration
      );
      setCost(c);
    }
  }

  // Load domain info if user is initialized and page is loaded
  useEffect(() => {
    if (router && router.query && isInitialized) {
      loadDomainInfo();
    }
  }, [router]);

  // Calculate cost everytime domainInfo or duration changes
  useEffect(() => {
    getCost();
  }, [domainInfo, renewFor]);

  if (!domainInfo) return null;

  return (
    <div className={styles.container}>
      <Head>
        <title>Flow Name Service - Manage Domain</title>
        <meta name="description" content="Flow Name Service" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>
        <div>
          <h1>{domainInfo.name}</h1>
          <p>ID: {domainInfo.id}</p>
          <p>Owner: {domainInfo.owner}</p>
          <p>
            Created At:{" "}
            {new Date(
              parseInt(domainInfo.createdAt) * 1000
            ).toLocaleDateString()}
          </p>
          <p>
            Expires At:{" "}
            {new Date(
              parseInt(domainInfo.expiresAt) * 1000
            ).toLocaleDateString()}
          </p>
          <hr />
          <p>Bio: {domainInfo.bio ? domainInfo.bio : "Not Set"}</p>
          <p>Address: {domainInfo.address ? domainInfo.address : "Not Set"}</p>
        </div>

        <div>
          <h1>Update</h1>
          <div className={styles.inputGroup}>
            <span>Update Bio: </span>
            <input
              type="text"
              placeholder="Lorem ipsum..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <button onClick={updateBio} disabled={loading}>
              Update
            </button>
          </div>

          <br />

          <div className={styles.inputGroup}>
            <span>Update Address: </span>
            <input
              type="text"
              placeholder="0xabcdefgh"
              value={linkedAddr}
              onChange={(e) => setLinkedAddr(e.target.value)}
            />
            <button onClick={updateAddress} disabled={loading}>
              Update
            </button>
          </div>

          <h1>Renew</h1>
          <div className={styles.inputGroup}>
            <input
              type="number"
              placeholder="1"
              value={renewFor}
              onChange={(e) => setRenewFor(e.target.value)}
            />
            <span> years</span>
            <button onClick={renew} disabled={loading}>
              Renew Domain
            </button>
          </div>
          <p>Cost: {cost} FLOW</p>
          {loading && <p>Loading...</p>}
        </div>
      </main>
    </div>
  );
}

```

Whoooo! Last thing, create a CSS file named `ManageDomain.module.css` under `pages/styles` and copy over the following code there:

```css
.container {
  background-color: #171923;
  min-height: 100vh;
}

.main {
  color: white;
  padding: 0 4em;
  display: flex;
  justify-content: center;
  gap: 12em;
}

.inputGroup {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5em;
  justify-content: center;
}

.inputGroup input {
  padding: 0.2em;
  border-radius: 0.5em;
  border-width: 0;
}

.main button {
  width: fit-content;
}
```

## 🎁 Wrapping Up

LETS GOOOO!!

If you did everything as mentioned, you should be able to run your website, login with your Flow wallet (make sure you use the Testnet faucet to get some tokens), purchase a few FNS domains, manage them, and look at all registered domains!

Congratulations!!!

This was overall a pretty big lesson series, so thank you for sticking with us so far. I hope you learnt a lot from this series, and as always, feel free to ask any questions on Discord if you got stuck anywhere!

Make sure to post a screenshot in the Discord `#showcase` channel of your app up and running!

🚀🚀🚀🚀🚀

Cheers 🥂

<SubmitQuiz />