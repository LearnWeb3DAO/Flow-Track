# Introduction to Flow

![](https://i.imgur.com/bQNXrDE.png)

In the Junior Track, we gave a brief introduction about the Flow blockchain in the Layer 1 level. In this track dedicated to Flow, we will get much deeper into Flow's concepts and also build on it!

Are you excited? 🚀

## What is Flow?

Flow is a Layer-1 blockchain that is designed to be highly scalable without the need of sharding. It utilizes a multi-role architecture that makes it unique from other blockchains, and allows it to scale vertically.

The Flow blockchain is also built by Dapper Labs, the company behind CryptoKitties, the ERC-721 standard for NFTs, and NBA Topshot.

By not depending on sharding, Flow provides a more developer-friendly and validator-friendly environment to build on, or run nodes for, Flow.

## Pipelining ⚒

Blockchains today require node runners to run monolithic nodes. Each node typically stores the entire state of the blockchain, and performs all the work associated with processing every transaction on the blockchain. This includes the collection of transactions being sent by users, grouping them into blocks, executing the transactions, reaching consensus on the state of the chain, and verifying each incoming block by other nodes.

In the physical world, this type of approach is rarely seen. In fact, one of the great inventions by Henry Ford was the creation of the moving assembly line, which brought down the time taken to build a car from over 12 hours to just over 1 hour.

In modern CPUs as well, pipelining is a common strategy to let your CPU perform faster. Instead of processing each task one by one, pipelining separates concerns and increases parallelism that results in an increase in speed.

---

Let's take a look at an example to understand this concept better. Let's say there are four loads of laundry that need to be washed, dried, and folded. We could put the the first load in the washer for 30 minutes, dry it for 40 minutes, and then take 20 minutes to fold the clothes. Then pick up the second load and wash, dry, and fold, and repeat for the third and fourth loads. Supposing we started at 6 PM and worked as efficiently as possible, we would still be doing laundry until midnight.

![](https://i.imgur.com/whBgVxk.png)
Source: [Stanford CS Department](https://cs.stanford.edu/people/eroberts/courses/soco/projects/risc/pipelining/index.html)

However, a smarter approach to the problem would be to put the second load of dirty laundry into the washer after the first was already clean and whirling happily in the dryer. Then, while the first load was being folded, the second load would dry, and a third load could be added to the pipeline of laundry. Using this method, the laundry would be finished by 9:30.

![](https://i.imgur.com/xOYO7U6.png)
Source: [Stanford CS Department](https://cs.stanford.edu/people/eroberts/courses/soco/projects/risc/pipelining/index.html)

## Multi-Role Architecture ⛓

Flow takes the concept of pipelining, and applies it to the blockchain. It splits up the role of a validator node into four different roles:

- Collection
- Consensus
- Execution
- Verification

The separation of labor between nodes happens vertically, i.e. across different validation stages for each transaction. Every validator nodes still takes part in the overall process, but only at one of the above mentioned four stages. This allows them to specialize for, and greatly increase the efficiency of, their particular focus area.

This allows Flow to scale greatly, while maintaining a shared execution environment for all operations on the network.

**Collection Nodes** are what user-facing dApps would typically use. They are there to enhance network connectivity, and make data available for dApps.

**Consensus Nodes** are used to decide the presence of and order of transactions, and blocks, on the blockchain.

**Execution Nodes** are used to perform the computation associated with each transaction. For example, executing a smart contract function.

**Verification Nodes** are used to keep the execution nodes in check, and make sure that they are not attempting to do any fraudulent transactions.

## Cadence 🤯

Arguably an even more important aspect of Flow is the programming language used to write smart contracts. The Flow team developed a new programming language called Cadence, which is the first ergonomic, resource-oriented smart contract programming language.

Throughout this track, we will delve much deeper into Cadence, and explore what it means to be resource-oriented through programming levels.

## Upgradeable Contracts

We're all familiar with the fact that on EVM chains, smart contracts cannot be upgraded after deployment (Not including the error-prone and complicated upgradeable proxy design patterns).

But, it is quite hard to build software that will potentially hold hundreds of millions, if not billions, in value and make it completely error-free the first time. [Rekt News](https://rekt.news) has a huge list of smart contracts that got hacked for millions due to tiny bugs in the original design, some of which weren't uncovered even after professional audits.

On Flow, developers can choose to deploy smart contracts to the mainnet in a "beta state". While in this state, code can be incrementally updated by the original authors. Users are warned about the contract being in the beta state when interacting with it, and can choose to wait until the code is finalized. Once the authors are confident that their code is safe, they can release control of the contract and it forever becomes non-upgradeable after that.

## Popular dApps on Flow

Flow is home to some really popular and mainstream dApps. They are mostly gaming and metaverse related, as Dapper Labs has prided itself on helping bring the next billion users on-chain through gaming.

**[NBA Topshot](https://nbatopshot.com)**
The biggest dApp on Flow, having done billions in trade volume, NBA Topshot is an official NBA metaverse experience built in collaboration with Dapper Labs on the Flow blockchain.

Not just on Flow, NBA Topshot is one of the highest ranking NFT projects of all time, coming in Top 10 according to sales volume.

**[NFL All Day](https://nflallday.com/)**
The second biggest dApp on Flow. It is an official NFL metaverse experience, somewhat similar to NBA Topshot, also built on the Flow blockchain.

If that wasn't enough sports NFTs, there's more!

**[UFC Strike](https://ufcstrike.com)**
The official UFC licensed metaverse experience, also built on the Flow blockchain!

Many more... View the full list on [Flowverse](https://www.flowverse.co/)

<SubmitQuiz />
