import Domains from "../contracts/Domains.cdc"
import FungibleToken from "../contracts/interfaces/FungibleToken.cdc"
import NonFungibleToken from "../contracts/interfaces/NonFungibleToken.cdc"

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