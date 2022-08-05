import Domains from "../contracts/Domains.cdc"

transaction(domainLen: Int, price: UFix64) {
    let registrar: &Domains.Registrar
    prepare(account: AuthAccount) {
        self.registrar = account.borrow<&Domains.Registrar>(from: Domains.RegistrarStoragePath) ?? panic("Could not borrow Registrar")
    }

    execute {
        self.registrar.setPrices(key: domainLen, val: price)
    }
}