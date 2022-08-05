import Domains from "../contracts/Domains.cdc"

pub fun main(nameHash: String): Bool {
    return Domains.isExpired(nameHash: nameHash)
}