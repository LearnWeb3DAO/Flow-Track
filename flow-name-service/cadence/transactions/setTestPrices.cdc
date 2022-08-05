import Domains from "../contracts/Domains.cdc"

transaction() {
    let registrar: &Domains.Registrar
    prepare(account: AuthAccount) {
        self.registrar = account.borrow<&Domains.Registrar>(from: Domains.RegistrarStoragePath) ?? panic("Could not borrow Registrar")
    }

    execute {
        var len = 1
        while len < 11 {
            self.registrar.setPrices(key: len, val: 0.000001)
            len = len + 1
        }
    }
}