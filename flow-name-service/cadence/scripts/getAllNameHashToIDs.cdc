import Domains from "../contracts/Domains.cdc"

pub fun main(): {String: UInt64} {
    return Domains.getAllNameHashToIDs()
}