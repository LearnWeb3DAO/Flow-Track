import Domains from "../contracts/Domains.cdc"

pub fun main(): {Int: UFix64} {
    return Domains.getPrices()
}