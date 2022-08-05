import Domains from "../contracts/Domains.cdc"

pub fun main(): UFix64 {
    return Domains.getVaultBalance()
}