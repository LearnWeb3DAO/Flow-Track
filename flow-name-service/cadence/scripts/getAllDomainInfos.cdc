import Domains from "../contracts/Domains.cdc"

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