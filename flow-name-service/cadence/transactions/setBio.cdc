import Domains from "../contracts/Domains.cdc"

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
        self.domain = domain
    }
    execute {
        self.domain.setBio(bio: bio)
    }
}