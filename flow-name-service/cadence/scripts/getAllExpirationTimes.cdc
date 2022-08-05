import Domains from "../contracts/Domains.cdc"

pub fun main(): {String: UFix64} {
    return Domains.getAllExpirationTimes()
}