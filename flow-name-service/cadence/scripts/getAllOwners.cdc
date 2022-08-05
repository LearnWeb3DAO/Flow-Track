import Domains from "../contracts/Domains.cdc"

pub fun main(): {String: Address} {
    return Domains.getAllOwners()
}