import Domains from "../contracts/Domains.cdc"
import FungibleToken from "../contracts/interfaces/FungibleToken.cdc"

transaction(amount: UFix64) {
    let registrar: &Domains.Registrar
    let receiver: Capability<&{FungibleToken.Receiver}>
    prepare(account: AuthAccount) {
        self.registrar = account.borrow<&Domains.Registrar>(from: Domains.RegistrarStoragePath) ?? panic("Could not borrow Registrar")
        self.receiver = account.getCapability<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
    }
    execute {
        self.registrar.withdrawVault(receiver: self.receiver, amount: amount)
    }
}