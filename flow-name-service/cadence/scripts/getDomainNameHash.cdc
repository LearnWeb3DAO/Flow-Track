import Domains from "../contracts/Domains.cdc"

pub fun main(name: String): String {
    return Domains.getDomainNameHash(name: name)
}