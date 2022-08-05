import Domains from "../contracts/Domains.cdc"

pub fun main(): UInt64 {
    return Domains.totalSupply
}