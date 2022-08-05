import Domains from "../contracts/Domains.cdc"
import FungibleToken from "../contracts/interfaces/FungibleToken.cdc"
import FlowToken from "../contracts/tokens/FlowToken.cdc"

transaction {
    let registrar: &Domains.Registrar
    let vault: @FungibleToken.Vault
    prepare(account: AuthAccount) {
        self.registrar = account.borrow<&Domains.Registrar>(from: Domains.RegistrarStoragePath) ?? panic("Could not borrow Registrar")
        self.vault <- FlowToken.createEmptyVault()
    }

    execute {
        self.registrar.updateRentVault(vault: <- self.vault)
    }
}