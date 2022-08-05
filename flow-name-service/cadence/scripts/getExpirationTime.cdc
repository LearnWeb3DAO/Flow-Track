import Domains from "../contracts/Domains.cdc"

pub fun main(nameHash: String): UFix64? {
    return Domains.getExpirationTime(nameHash: nameHash)
}