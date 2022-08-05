# General Purpose NFT Storefront on Flow - Part 2

![](https://i.imgur.com/iOViqux.png)

Congratulations, and welcome to the last programming level of the Flow Track! We hope you've learnt a lot over the last few lessons - and have a much better understanding of Flow, and how to build on Flow.

In this final level, we will create a website that uses the NFT Storefront.

However, creating our own events indexer, setting up a database, writing server side code, is a bit out of scope for LearnWeb3 as that is all Web2 tech and Web2 knowledge - we will build something simpler.

Considering that the highest activity out of the Storefront contracts happens on the Version 1 Contract on Flow Mainnet - we will build a website where we can display in real time the listings that are being created and being bought.

While we did not learn about the V1 contracts specifically, a lot of the code is the same as V2. V2 obviously has certain improvements, but as far as the events go, they're quite similar (with V1 having some less things included in the events compared to V2).

Since it is mainnet, we will not be implementing Purchase functionalities as we do not deal with mainnet tokens - however given all the complexity and coding we did in the FNS levels, and also considering that the Storefront and all transactions/scripts used for it are open-source - that should be possible for most of you to do by yourself at this point if you choose to, and if you did the earlier lessons diligently.

## 👨‍🔬 Setting Up

Open up your terminal, and enter a directory where you want to create the Next.js app we will be building. Then type the following:

```shell
npx create-next-app@latest flow-listings-viewer
```

### 🥅 The Goal

This will be a fairly simple application. By the end of it, we just want that on the Homepage of our application, real-time updates are made which track events as they happen on the network and display details about the Listing.

We do not track any historical events, due to the lack of an indexing service. We start listening for events when the webpage is loaded, and as long as it is loaded, we fetch new events every few seconds and update the list on our homepage.

It will end up looking similar to the attached image at the top of this lesson. The goal is to get you to understand how to use the Flow Client Library to listen to events being emitted from a contract.

In our case, we'll do it in a Next.js app. If you were to build an indexer, you could do something similar in a backend server-side application and then save the event data in a database so you can have access to historical data later on as well.

### 💰 Installing and Configuring FCL

Open up your terminal, and point to the `flow-listings-viewer` directory. Run the following command to add the FCL dependency:

```shell
npm install @onflow/fcl
```

Great! Now, let's add the configuration for FCL. We only need a couple of things this time since we don't even need the user to connect their wallet.

Create a directory named `flow` under `flow-listings-viewer`, and within it, create a file named `config.js`.

Add the following code in that file:

```javascript
import { config } from "@onflow/fcl";

config({
  "accessNode.api": "https://rest-mainnet.onflow.org",
  eventPollRate: 2000
});
```

Super simple configuration. The `accessNode.api` points to the RPC URL for the Flow mainnet, and the `eventPollRate` set to 2000 (milliseconds) means that FCL will check for new events once every two seconds.

### 🏠 Building the Homepage

Open up `pages/index.js` and delete all the boilerplate code there. We are going to replace it with our own code.

It's fairly straightforward, so I'll give it to you all at once - go through the code comments to understand what is happening.

```jsx
import "../flow/config";
import * as fcl from "@onflow/fcl";
import styles from "../styles/Home.module.css";
import { useEffect, useState } from "react";

// Events are identified using a specific syntax defined by Flow
// A.{contractAddress}.{contractName}.{eventName}
// 
// The following two constants are the event identifiers (event keys as Flow calls them)
// for the `ListingAvailable` and `ListingCompleted` events
// for NFTStorefront V1 on Flow Mainnet
const ListingAvailableEventKey =
  "A.4eb8a10cb9f87357.NFTStorefront.ListingAvailable";
const ListingCompletedEventKey =
  "A.4eb8a10cb9f87357.NFTStorefront.ListingCompleted";

export default function Home() {
  // Define two state variables to keep track of the two types of events
  const [availableEvents, setAvailableEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
    
  // When page is first loaded, subscribe (listen for) new events
  useEffect(() => {
      
    // Listen for `ListingAvailable` events
    // Add any new events to the front of the state variable array
    // New events on top, old events on bottom
    fcl.events(ListingAvailableEventKey).subscribe(events => {
      setAvailableEvents(oldEvents => [events, ...oldEvents]);
    });
      
    // Similarly, listen for `ListingCompleted` events
    fcl.events(ListingCompletedEventKey).subscribe(events => {
      setCompletedEvents(oldEvents => [events, ...oldEvents]);
    });
  }, []);

  return (
    <div className={styles.main}>
      <div>
        <h2>ListingAvailable</h2>
        {availableEvents.length === 0
          // If the `availableEvents` array is empty, say that no events
          // have been tracked yet
          // Else, loop over the array, and display information given to us
          ? "No ListingAvailable events tracked yet"
          : availableEvents.map((ae, idx) => (
              <div key={idx} className={styles.info}>
                <p>Storefront: {ae.storefrontAddress}</p>
                <p>Listing Resource ID: {ae.listingResourceID}</p>
                <p>NFT Type: {ae.nftType.typeID}</p>
                <p>NFT ID: {ae.nftID}</p>
                <p>Token Type: {ae.ftVaultType.typeID}</p>
                <p>Price: {ae.price}</p>
              </div>
            ))}
      </div>

      <div>
        <h2>ListingCompleted</h2>
        {completedEvents.length === 0
          // Similarly, do the same with `completedEvents`
          ? "No ListingCompleted events tracked yet"
          : completedEvents.map((ce, idx) => (
              <div key={idx} className={styles.info}>
                <p>Storefront Resource ID: {ce.storefrontResourceID}</p>
                <p>Listing Resource ID: {ce.listingResourceID}</p>
                <p>NFT Type: {ce.nftType.typeID}</p>
                <p>NFT ID: {ce.nftID}</p>
              </div>
            ))}
      </div>
    </div>
  );
}
```

That's it folks! Try running your app with `npm run dev` in the terminal, and wait a few seconds, it should start showing some events to you!

Super cool! Now we know how to listen for events emitted on the Flow blockchain.

You can use this knowledge to also build a real-time events displayer for the FNS Domains Contract 👀 and track everytime a new domain is registered, a domain is renewed, a bio is updated, or a linked address is updated.

## 🎁 Wrapping Up

Congratulations, you've completed the last programming level for the Flow Track! Head over to the last lesson after this to learn a bit more about the Flow ecosystem, and what projects are building on Flow, and then graduate!!!

Cheers 🥂