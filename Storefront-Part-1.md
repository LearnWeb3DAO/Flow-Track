# General Purpose NFT Storefront on Flow - Part 1

![](https://i.imgur.com/LgpRV1K.png)

In this lesson series, we will look into Flow's NFT Storefront Smart Contracts, and understand how they are different from marketplaces such as OpenSea or LooksRare on Ethereum, and what makes them interesting.

This is not your traditional 'Build an NFT Marketplace' tutorial - so stay tuned!

## 😴 OpenSea, LooksRare, etc

There exist a myriad of NFT Marketplaces on Ethereum, of which OpenSea and LooksRare are some of the most well known. However, the challenge with the way they have been developed is that they are all individual custom implementations of how a marketplace should work.

Considering `setApprovalForAll` on Ethereum can only give 'Approval for All' to only one address at any given time for a specific NFT Smart Contract, if you wanted to list NFTs for sale on both OpenSea and LooksRare, and jump back and forth, having to do Approval transactions each time is a pain.

Historically, the fragmentation was not much of an issue on Ethereum considering the dominance of OpenSea in the NFT trading world, but nowadays it's becoming more obvious.

OpenSea specifically also does a lot of custom off-chain things, so even if you wanted to maintain compatibility with their smart contract as it exists, it is not enough to just do that - because a lot of their functionalities work based off closed-source off-chain code that they wrote.

Recently, however, OpenSea did release SeaPort - a new set of smart contracts which removes the need for their custom off-chain code, and they hope the SeaPort contracts will help standardize NFT Marketplaces on Ethereum and converge on using a shared set of contracts across various marketplaces. Right now, however, this is not something that is being used in production at the time of writing, and we have yet to see how the adoption looks like for that standard.

<Quiz questionId="6e3efe15-5c69-4fb5-b4b0-439449edfc46" />

## ⁉️ NFT Storefront

The Flow team realised this was going to a problem a long time ago, and created a general purpose `NFTStorefront` contract that offers a shared Cadence smart contract interface that various marketplace products can all use and end up with a unified view of listings, activity, trading, etc. across all of them.

This was upgraded afterwards with `NFTStorefrontV2` which utilized some new features built into the Cadence language, and improved upon the old offerings.

Since this means we don't have to write custom smart contracts to build an NFT Marketplace, we will just dig deeper into `NFTStorefrontV2` in this lesson, and then implement a frontend website for it in the next.

All the code for the NFT Storefront Cadence contracts can be found on Github - [onflow/nft-storefront](https://github.com/onflow/nft-storefront).

We'll only be focusing on `NFTStorefrontV2` for obvious reasons, and not dig into `NFTStorefront` (Version 1).

Hopefully through this lesson you also get some idea on how I like to approach and understand new codebases, even though this isn't a particularly large contract, and how the thinking process looks like - maybe it will help you!

<Quiz questionId="e0799363-3856-4fa2-a68a-d82702b6d77f" />

## ⛏️ Let's Dig!

I suggest opening up the contract code in your browser/code editor as you follow along this track - as we will only be inspecting small snippets at a time, and you can have the full contract open to get the full picture of how everything is working.

Open up this link - [NFTStorefrontV2.cdc](https://github.com/onflow/nft-storefront/blob/main/contracts/NFTStorefrontV2.cdc)

Now, let's dig into the smart contract!

Quickly skimming through the contract, you will notice there are two major Resources being used that we should be interested in.

- `Listing` resource
  - Implements `ListingPublic` resource interface
- `Storefront` resource
  - Implements `StorefrontPublic` and `StorefrontManager` resource interfaces

It's interesting to me that the `Listing` resource has no private portion, only a public interface implementation. I would have imagined there would be private functions to update the Listing price, etc - so I'll just make a mental note of that - I'm sure there's some way for the owner to update the Listing price so will be interesting to see how they did it.

Starting top down, let's make a list of the different structs, resources we would want to look at, and then decide on an order for them.

1. `SaleCut` struct
2. `ListingDetails` struct
3. `ListingPublic` resource interface
4. `Listing` resource
5. `StorefrontManager` resource interface
6. `StorefrontPublic` resource interface
7. `Storefront` resource
8. Global Functions

I'll skip `SaleCut` for now - as it looks like something that would be a part of a Listing. The name suggests it's some sort of Royalty-related thing, taking a cut from the listing sale price. We'll come back to this.

<Quiz questionId="f75ab458-3956-4d56-b46b-20293683e4dc" />

### ListingDetails

`ListingDetails` struct probably just contains all the information around a `Listing`. Similar to `DomainInfo` in the FNS lesson series earlier. Let's look at this and understand what information represents a single Listing.

#### Variables

Let's look at the variables for the struct first:

```javascript
pub var storefrontID: UInt64
pub var purchased: Bool
pub let nftType: Type
pub let nftUUID: UInt64
pub let nftID: UInt64
pub let salePaymentVaultType: Type
pub let salePrice: UFix64
pub let saleCuts: [SaleCut]
pub var customID: String?
pub let commissionAmount: UFix64
pub let expiry: UInt64
```

There are certain obvious ones here which are self explanatory - `purchased`, `nftID`, `salePrice`, `commissionAmount`, and `expiry`. We'll dig a bit deeper into the rest.

`storeFrontID` - Sounds like there will be multiple Storefronts, so each Listing needs to maintain an ID of which Storefront it's related to.
`nftUUID` - According to the official code, this is a unique identifier for the NFT Resource for which the listing is.
`saleCuts` - An array of `SaleCut` structs. Sounds like we can have multiple people getting a cut of the sale price? Perhaps 50% to one person and 50% to another
`customID` - An optional ID. The docs say this allows different dApp teams to specify custom data for their dApp implementation to help them filter events specific to their dApp.
`commissionAmount` - Someone gets a commission from the sale? Perhaps the dApp/Website which allows users to make listings?

---

There's two we skipped over, which are something new: `nftType` and `salePaymentVaultType`. These both have the data type `Type` which is something we haven't look into yet - so let's understand that a little.

Recall how in the FNS contract, our Domains NFT had a custom data type `Domains.NFT` which was specific to our NFT contract. Similarly, other NFT contracts define their own data types - which is important because they all would have some differences in the types of data being stored for each NFT.

Similarly, in FNS, we were accepting payment in a Flow Token Vault, i.e. only accepting Flow Tokens. However, not every person necessarily wants that. Some may instead want to accept payments in, for example, USDC.

The `Type` data type is something that represents a data type itself. Just like how you can specify primitive data types (`String`, `Bool`, `UInt64`, etc) or custom data types (`Domains.NFT`, `Domains.Collection`, etc) - the `Type` data type can store the data type being used itself.

For example, `nftType` here could store the _data type_ `Domains.NFT`, or `NonFungibleToken.NFT`, or `SomeNFTContract.NFT` etc. Note this is different from storing an actual value _of_ that data type - it's just storing the data type itself.

Similarly, in FNS we had `FlowToken.Vault` (which implements `FungibleToken.Vault`). `salePaymentVaultType` here could store the data types `FlowToken.Vault`, `USDCToken.Vault`, etc.

These can be used by the user to specify different currencies for each Listing they want to sell the NFT for, and specify the exact data type of each NFT for sale as well, while keeping the Storefront contract as generic as possible.

> P.S. If you've worked with static typed languages before that supported Generics (Java, Typescript, Kotlin, etc) - you can think of the `Type` data type as a generic type which can accept any other data type as it's own value.

<Quiz questionId="2632dd72-c7ce-4bc2-b7a6-6155044b4ff6" />

---

#### Functions

```javascript
access(contract) fun setToPurchased() {
    self.purchased = true
}

access(contract) fun setCustomID(customID: String?){
    self.customID = customID
}
```

Both functions are quite self explanatory. They give the `NFTStorefrontV2` contract permission to update a Listing's `purchased` and `customID` values. `purchased` starts off with an initial value `false`, and can only be updated to `true` - it can never go from `true` back to `false`

#### Initializer

```javascript
 init (
    nftType: Type,
    nftUUID: UInt64,
    nftID: UInt64,
    salePaymentVaultType: Type,
    saleCuts: [SaleCut],
    storefrontID: UInt64,
    customID: String?,
    commissionAmount: UFix64,
    expiry: UInt64
) {

    pre {
        // Validate the expiry
        expiry > UInt64(getCurrentBlock().timestamp) : "Expiry should be in the future"
        // Validate the length of the sale cut
        saleCuts.length > 0: "Listing must have at least one payment cut recipient"
    }
    self.storefrontID = storefrontID
    self.purchased = false
    self.nftType = nftType
    self.nftUUID = nftUUID
    self.nftID = nftID
    self.salePaymentVaultType = salePaymentVaultType
    self.customID = customID
    self.commissionAmount = commissionAmount
    self.expiry = expiry
    self.saleCuts = saleCuts

    // Calculate the total price from the cuts
    var salePrice = commissionAmount
    // Perform initial check on capabilities, and calculate sale price from cut amounts.
    for cut in self.saleCuts {
        // Make sure we can borrow the receiver.
        // We will check this again when the token is sold.
        cut.receiver.borrow()
            ?? panic("Cannot borrow receiver")
        // Add the cut amount to the total price
        salePrice = salePrice + cut.amount
    }
    assert(salePrice > 0.0, message: "Listing must have non-zero price")

    // Store the calculated sale price
    self.salePrice = salePrice
}
```

Nothing too fancy in this bit. We just ensure that the Listing is set to expire at a future time, and that at least one person is receiving the sale price if the listing is sold.

The only interesting thing here is the calculation of the `salePrice`. It's the cumulative sum of all the sale cuts and the commission amount. So for example, if an NFT is owned by two people i.e. they both invested money into it, they could want to sell it such that one person gets 50 Flow Tokens, another person gets 40 Flow Tokens, and maybe the dApp/Website they used to create this listing charges a 2 Flow Tokens commission fees on the sale. Thereby bringing the total price of the listing up to 92 Flow Tokens.

### SaleCut

Great, now that we have an educated guess around what `SaleCut` might be referring to, let's go back to it and look at what it actually is.

```javascript
 pub struct SaleCut {
    pub let receiver: Capability<&{FungibleToken.Receiver}>
    pub let amount: UFix64

    init(receiver: Capability<&{FungibleToken.Receiver}>, amount: UFix64) {
        self.receiver = receiver
        self.amount = amount
    }
}
```

Pretty standard stuff. I think our understanding is correct. Multiple people can receive different amounts from the sale of the NFT. A `SaleCut` struct just stores the amount that specific person will receive, along with a Capability to `FungibleToken.Receiver` so we can deposit tokens into their vault.

<Quiz questionId="2b04880c-f1e0-4343-b1e2-ed504b601d35" />

### ListingPublic

Let's check out the `ListingPublic` resource interface and see what functions we can expect for the `Listing` resource.

```javascript
pub resource interface ListingPublic {
    pub fun borrowNFT(): &NonFungibleToken.NFT?

    pub fun purchase(
        payment: @FungibleToken.Vault,
        commissionRecipient: Capability<&{FungibleToken.Receiver}>?,
    ): @NonFungibleToken.NFT

    pub fun getDetails(): ListingDetails

    /// getAllowedCommissionReceivers
    /// Fetches the allowed marketplaces capabilities or commission receivers.
    /// If it returns `nil` then commission is up to grab by anyone.
    pub fun getAllowedCommissionReceivers(): [Capability<&{FungibleToken.Receiver}>]?

}
```

The first three functions seem fairly self explanatory. `borrowNFT` will likely just borrow a reference to the NFT's public portion to look at it's details. `purchase` and `getDetails` do exactly what the name says.

What's interesting is `getAllowedCommissionReceivers`, which returns an array of `FungibleToken.Receiver` capabilities.

So, it looks like a Listing can be created where multiple marketplaces (dApps/websites) can be listed as a potential commision recipient. Perhaps because the user can post the listing to multiple marketplaces? This likely makes sense given, for example, NBA Topshot NFTs can be bought on their official storefront, but also general purpose marketplaces in the Flow ecosystem.

If we look back to `purchase`, we see that it specifies a specific `commisionRecipient`. So perhaps the seller can list on multiple marketplaces, and specify their multiple receiver capabilities, and then depending on where the buyer makes the purchase, a specific commission receiver actually receives it.

### Listing

The `Listing` resource itself is quite huge, partly due to the comments, and partly due to the complexity of the `purchase` function. However, the `purchase` function is also pretty much the only thing worth digging deeper into - the other stuff is fairly straightforward and I encourage you to try to understand what's going on there yourself.

Let's take a look at the implementation of the `purchase` function.

```javascript
pub fun purchase(
    payment: @FungibleToken.Vault,
    commissionRecipient: Capability<&{FungibleToken.Receiver}>?,
): @NonFungibleToken.NFT {

    pre {
        self.details.purchased == false: "listing has already been purchased"
        payment.isInstance(self.details.salePaymentVaultType): "payment vault is not requested fungible token"
        payment.balance == self.details.salePrice: "payment vault does not contain requested price"
        self.details.expiry > UInt64(getCurrentBlock().timestamp): "Listing is expired"
        self.owner != nil : "Resource doesn't have the assigned owner"
    }
    // Make sure the listing cannot be purchased again.
    self.details.setToPurchased()

    if self.details.commissionAmount > 0.0 {
        // If commission recipient is nil, Throw panic.
        let commissionReceiver = commissionRecipient ?? panic("Commission recipient can't be nil")
        if self.marketplacesCapability != nil {
            var isCommissionRecipientHasValidType = false
            var isCommissionRecipientAuthorised = false
            for cap in self.marketplacesCapability! {
                // Check 1: Should have the same type
                if cap.getType() == commissionReceiver.getType() {
                    isCommissionRecipientHasValidType = true
                    // Check 2: Should have the valid market address that holds approved capability.
                    if cap.address == commissionReceiver.address && cap.check() {
                        isCommissionRecipientAuthorised = true
                        break
                    }
                }
            }
            assert(isCommissionRecipientHasValidType, message: "Given recipient does not has valid type")
            assert(isCommissionRecipientAuthorised,   message: "Given recipient has not authorised to receive the commission")
        }
        let commissionPayment <- payment.withdraw(amount: self.details.commissionAmount)
        let recipient = commissionReceiver.borrow() ?? panic("Unable to borrow the recipent capability")
        recipient.deposit(from: <- commissionPayment)
    }
    // Fetch the token to return to the purchaser.
    let nft <-self.nftProviderCapability.borrow()!.withdraw(withdrawID: self.details.nftID)
    // Neither receivers nor providers are trustworthy, they must implement the correct
    // interface but beyond complying with its pre/post conditions they are not gauranteed
    // to implement the functionality behind the interface in any given way.
    // Therefore we cannot trust the Collection resource behind the interface,
    // and we must check the NFT resource it gives us to make sure that it is the correct one.
    assert(nft.isInstance(self.details.nftType), message: "withdrawn NFT is not of specified type")
    assert(nft.id == self.details.nftID, message: "withdrawn NFT does not have specified ID")

    // Fetch the duplicate listing for the given NFT
    // Access the StoreFrontManager resource reference to remove the duplicate listings if purchase would happen successfully.
    let storeFrontPublicRef = self.owner!.getCapability<&NFTStorefrontV2.Storefront{NFTStorefrontV2.StorefrontPublic}>(NFTStorefrontV2.StorefrontPublicPath)
                                .borrow() ?? panic("Unable to borrow the storeFrontManager resource")
    let duplicateListings = storeFrontPublicRef.getDuplicateListingIDs(nftType: self.details.nftType, nftID: self.details.nftID, listingID: self.uuid)

    // Let's force removal of the listing in this storefront for the NFT that is being purchased.
    for listingID in duplicateListings {
        storeFrontPublicRef.cleanup(listingResourceID: listingID)
    }

    // Rather than aborting the transaction if any receiver is absent when we try to pay it,
    // we send the cut to the first valid receiver.
    // The first receiver should therefore either be the seller, or an agreed recipient for
    // any unpaid cuts.
    var residualReceiver: &{FungibleToken.Receiver}? = nil
    // Pay the comission
    // Pay each beneficiary their amount of the payment.
    for cut in self.details.saleCuts {
        if let receiver = cut.receiver.borrow() {
           let paymentCut <- payment.withdraw(amount: cut.amount)
            receiver.deposit(from: <-paymentCut)
            if (residualReceiver == nil) {
                residualReceiver = receiver
            }
        } else {
            emit UnpaidReceiver(receiver: cut.receiver.address, entitledSaleCut: cut.amount)
        }
    }

    assert(residualReceiver != nil, message: "No valid payment receivers")

    // At this point, if all recievers were active and availabile, then the payment Vault will have
    // zero tokens left, and this will functionally be a no-op that consumes the empty vault
    residualReceiver!.deposit(from: <-payment)

    // If the listing is purchased, we regard it as completed here.
    // Otherwise we regard it as completed in the destructor.
    emit ListingCompleted(
        listingResourceID: self.uuid,
        storefrontResourceID: self.details.storefrontID,
        purchased: self.details.purchased,
        nftType: self.details.nftType,
        nftUUID: self.details.nftUUID,
        nftID: self.details.nftID,
        salePaymentVaultType: self.details.salePaymentVaultType,
        salePrice: self.details.salePrice,
        customID: self.details.customID,
        commissionAmount: self.details.commissionAmount,
        commissionReceiver: self.details.commissionAmount != 0.0 ? commissionRecipient!.address : nil,
        expiry: self.details.expiry
    )

    return <-nft
}
```

Whooo boy. Alright, let's start from the top. The `purchase` function takes two arguments - a reference to a `FungibleToken.Vault` which should hold the payment tokens, and a `commisionRecipient` capability as described above.

Then, we do some basic checks. We ensure the listing has not already been sold. We ensure the payment token sent is the same type as specified in `salePaymentVaultType` (recall our discussion above on `Type`). We ensure they have sent enough tokens to purchase the listing. We ensure the listing hasn't expired yet. And, we ensure that the Listing still has an owner set i.e. maybe they haven't traded the NFT to someone else outside a marketplace using this contract.

We then flip the switch and mark this listing as purchased.

If the commission amount was set to be >0 tokens, we try to ensure that the `commisionRecipient` is part of our approved marketplaces where we listed the NFT. If we did not set an approved list, then the `commisionRecipient` is automatically considered valid. We use the `commisionRecipient` capability to withdraw part of the sent payment and deposit it into the marketplace's Vault.

We then withdraw the NFT Resource out from the current owner's Collection, and ensure it is of the same type as `nftType` specified in the listing. We then attempt to remove any duplicate listings for the same NFT from the Storefront as well, in case they exist.

Then, for all the specified `saleCuts`, we send everyone their share of the sale.

Finally, we emit a `ListingCompleted` event to let everyone know a listing has been sold, and return the `NFT` resource to the caller of the `purchase` function (the buyer) so they can add it to their NFT Collection in their storage.

### StorefrontManager

Let's look at the private portion of the functions present in a Storefront resource.

```javascript
pub resource interface StorefrontManager {
    pub fun createListing(
        nftProviderCapability: Capability<&{NonFungibleToken.Provider, NonFungibleToken.CollectionPublic}>,
        nftType: Type,
        nftID: UInt64,
        salePaymentVaultType: Type,
        saleCuts: [SaleCut],
        marketplacesCapability: [Capability<&{FungibleToken.Receiver}>]?,
        customID: String?,
        commissionAmount: UFix64,
        expiry: UInt64
    ): UInt64

    pub fun removeListing(listingResourceID: UInt64)
}
```

Seems pretty straightforward. One function to create a new listing within the Storefront, and one function to remove a listing. We will look at their implementations shortly - those will be more interesting.

### StorefrontPublic

```javascript
pub resource interface StorefrontPublic {
    pub fun getListingIDs(): [UInt64]
    pub fun getDuplicateListingIDs(nftType: Type, nftID: UInt64, listingID: UInt64): [UInt64]
    pub fun borrowListing(listingResourceID: UInt64): &Listing{ListingPublic}?
    pub fun cleanupExpiredListings(fromIndex: UInt64, toIndex: UInt64)
    access(contract) fun cleanup(listingResourceID: UInt64)
}
```

Again, pretty straightforward. A few getter functions, one function to borrow the public portion of the Listing resource, and a couple of functions to clean up (remove) expired listings and a contract-only function to clean up a specific listing (probably for removing duplicate listings, as we saw in the `purchase` function above

### Storefront

Before we dig into the Storefront, I was a little confused of why anyone would want to make duplicate listings of their NFT. However, looking at the short and sweet Github readme for these contracts, we see that it says "An NFT may be listed in one or more listings".

So it sounds like duplicate listings don't exactly mean an exact replica, but rather the same NFT for sale as two different listings - perhaps for a different price, or different expiry, different commission amount, different sale cuts, etc.

This is further highlighted by the dictionary stored in the `Storefront` resource:

```javascript
/// Dictionary to keep track of listing ids for same NFTs listing.
/// nftType.identifier -> nftID -> [listing resource ID]
access(contract) var listedNFTs: {String: {UInt64 : [UInt64]}}
```

So for a given 'type' of NFT, we have a certain nftID, which can be put up for sale in multiple listings so we have an array of listing resource IDs to track.

Apart from this, note that within the `createListing` function of the Storefront, there exists this line:

```javascript
// Add the `listingResourceID` in the tracked listings.
self.addDuplicateListing(nftIdentifier: nftType.identifier, nftID: nftID, listingResourceID: listingResourceID)
```

Which calls the `addDuplicateListing` function which automatically adds the listing resource ID to the above mapping, with this listing possibly being the only listing for the given NFT, or possibly being the 10th listing for this NFT, or whatever.

Everything else is mostly straightforward within the `Storefront` resource. I highly suggest you go through it yourself, and if you have any doubts, ask them on the Discord server, and I'd be happy to help you!

<Quiz questionId="ed19b479-53af-4e4d-8b56-a9bd1082696c" />

### Global Things

Last but not least, there is a global function and the contract initializer we need to look at.

```javascript
pub fun createStorefront(): @Storefront {
    return <-create Storefront()
}
```

This function just creates a new `Storefront` resource and returns it to the caller. Essentially, the idea is that each user manages their own `Storefront` resource, and various marketplaces can gather data emitted through events by the smart contract to build up their website listings page, activity page, etc.

This is a public function, i.e. anyone can come in and create a `Storefront` resource for themselves.

```javascript
init () {
    self.StorefrontStoragePath = /storage/NFTStorefrontV2
    self.StorefrontPublicPath = /public/NFTStorefrontV2
}
```

The initializer is quite simple. It just specifies the Storage and Public path for the Storefront contract. Note, we did not specify a private path here. That is because there is no need to give access to the private portion of the resource to anyone except for the owner of the `Storefront` themself, and they can just get it from the Storage path directly.

<Quiz questionId="077afe74-1a1d-411f-95b1-56290792d205" />

## 🐗 Examples in the Wild

Using a shared contract for a Storefront also means that various NFT projects can setup their own marketplaces, and design the experience to be native to their ecosystem, instead of relying on third-party websites like OpenSea.

We see that most NFT projects on Flow actually have their own in-built custom-designed marketplace, which are all using the Storefront contract for the trading part of things. Here's some of the biggest examples:

- [NBA Topshot Marketplace](https://nbatopshot.com/marketplace)
- [NFL All Day Marketplace](https://nflallday.com/marketplace/moments)
- [UFC Strike Marketplace](https://ufcstrike.com/p2pmarketplace)
- [Flovatar Marketplace](https://flovatar.com/marketplace)

and many more... Find the full list on [Flowverse Marketplaces](https://www.flowverse.co/categories/marketplaces).

---

> NOTE: However, since the `NFTStorefrontV2` contract was very recently updated (first draft created in June, 2022 - with the latest code update to it made late July, 2022), most pre-existing dApps currently use the Version 1 `NFTStorefront` contract.

You can see the difference in the number of transactions taking place (which is massive) on the Flowscan Explorer.

[Version 1 NFTStorefront Flowscan](https://flowscan.org/contract/A.4eb8a10cb9f87357.NFTStorefront) has over 6 million transactions

whereas, [Version 2 NFTStorefront Flowscan](https://flowscan.org/contract/A.4eb8a10cb9f87357.NFTStorefrontV2) has none at the moment.

Things do look better on testnet though, where `NFTStorefrontV2` is gaining new test transactions every day, and it's clear that some projects are working on a transition to the V2 contract.

<Quiz questionId="3a7ccdda-a763-454c-9616-8c35fdccf78c" />

## 🎁 Wrapping Up

Hopefully this level presented some challenges to you. I intentionally left out explaining some of the relatively easier parts of the `NFTStorefrontV2` smart contract and highly suggest you take the time to understand it yourself. Happy to help you if you get stuck somewhere or have a question (or ten).

Regardless, it's pretty cool to me that marketplaces on Flow can all use the same shared base smart contract where each user can set up their own Storefront and add Listings to it, and the various marketplaces can just listen for the events being emitted by the contract to display active listings on their website.

Since we don't have something like The Graph on Flow (maybe one of you wants to build it), such indexing of these events has to be done ourselves. Thankfully, the Flow Client Library (FCL) has functions which can help us return a list of events of a specific type within a 250 block range, but that still means to index _every_ event from the beginning of the blockchain, we have to write code to fetch those events in 250 block chunks, and save them in a local database somewhere, so our marketplace can display _all_ listings that are active - not just the ones which were created/updated within the last 250 blocks.

You can find an example of such an indexer open sourced by the [Rarible](https://rarible.org) team here - [rarible/flow-nft-indexer](https://github.com/rarible/flow-nft-indexer). While it's not an indexer for the Storefront, it is an indexer for NFTs generally to track all NFTs that exist on Flow. It's written in Kotlin, and uses MongoDB as a backend to save data to.

<SubmitQuiz />
