import * as fcl from "@onflow/fcl";
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
