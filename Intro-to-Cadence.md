# Cadence - How to build dApps on Flow

![](https://images.unsplash.com/photo-1635407640793-72dd329d218a?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80)

In this level, we will learn about Cadence, the smart contracts programming language created and used by Flow. As we have already mentioned, Cadence is a resource-oriented programming language, so it comes with bit of a learning curve. The syntax for it is kind of like if Golang and Javascript had a baby.

Before we get into that, let's understand a little bit around how Flow works.

## 🤔 Transactions and Scripts

Transactions on Flow are not much different than transactions on any blockchain. They're function calls which cost fees, and is the only way to 'write' data on the blockchain.

Scripts, on the other hand, are function calls that do not cost money. They're like `view` functions in Solidity.

The main thing to remember in Flow is that both Transactions and Scripts are written in Cadence as well, and then they're just executed through a wallet. But, it is Cadence code that determines what a single transaction/script is going to do, what contracts it's going to interact with, what values it's going to return, etc.

We will clear this up with examples as we proceed.

## 🛝 Flow Playground

To start testing, Flow offers an online playground where you can test your code. This works somewhat similar to Remix with a Javascript VM on EVM chains.

For now, we will do all our development in the Flow Playground. [Open it up by clicking here.](https://play.onflow.org/)

You should see something like this.

![](https://i.imgur.com/TGakwxx.png)

In the left, you can see 5 accounts (0x01 to 0x05). These are obviously fake accounts, but are given to use by the Flow playground to test smart contracts with multiple parties involved. Additionally, since smart contracts get deployed to addresses, in the case of the Flow playground we can just deploy them to any one of the given five addresses - which makes testing easier.

Right below that, we also have the option of creating new Transactions and new Scripts i.e. writing Cadence code for them. We will come back to this.

And right in the middle we see we get an option to customize our project details. We'll skip this for now.

## 👨‍💻 Cadence Code

Click on the `0x01` account in the sidebar to write code for that account. You will see there already exists some basic hello world code there, a simple smart contract that already exists.

Let's analyze what this code is doing, and learn the Cadence syntax.

```javascript
access(all) contract HelloWorld {

    // Declare a public field of type String.
    //
    // All fields must be initialized in the init() function.
    access(all) let greeting: String

    // The init() function is required if the contract contains any fields.
    init() {
        self.greeting = "Hello, World!"
    }

    // Public function that returns our friendly greeting!
    access(all) fun hello(): String {
        return self.greeting
    }
}
```

### The Contract Block

The first thing to notice is how all of the smart contract code is wrapped inside a `contract` block.

```javascript
access(all) contract HelloWorld {
    // ...
}
```

> In newer versions of Cadence, you can replace `access(all)` with `pub` which is a shorthand that means the same thing. i.e. "public access" or "access for all".
> We will be following the `pub` convention as we proceed.

the `pub contract ContractName` will always be necessary no matter what smart contract you're writing.

### The Variable Declarations

```javascript
// Declare a public field of type String.
//
// All fields must be initialized in the init() function.
access(all) let greeting: String
```

This line here declares a public variable, named `greeting`, of the type String. Similar to the contract block, we can replace `access(all)` with `pub` if we want to, which we will because it is easier to read and understand.

### The Initializer

```javascript
// The init() function is required if the contract contains any fields.
init() {
    self.greeting = "Hello, World!"
}
```

Every Cadence smart contract, if it has any variables at all, *MUST* contain an `init()` function as that is how you set the initial values for any variables you have. Unlike Solidity, you cannot set initial values directly next to the variable declaration.

In this case, we are setting the initial value of the `greeting` variable.

This is similar to a constructor, as it is only run once when the contract is initially deployed.

### The Functions

```javascript
// Public function that returns our friendly greeting!
access(all) fun hello(): String {
    return self.greeting
}
```

This is a super simple function, a public function named `hello` that returns a String. It just returns `self.greeting`, which is our `greeting` variable we declared above. If we call this function, we will get `"Hello, World!"` since we did not change the variable's value.

## 🚀 Deploying

To deploy our smart contracts in the Flow playground, just click the shiny green `Deploy` button in the top right.

Once the contract is deployed, you will see some logs in the console at the bottom of the page, and also notice that the account `0x01` now has a name attached to it - this is the name of the contract. In our case, it should be `HelloWorld`.

## ✍️ Scripting

Now, if we want to read the value of the `greeting` variable, we will write a Cadence script to do just that.

In the sidebar, click on `Script` under Script Templates. There should be some pre-existing code, just a function that returns the value `1`, let's get rid of that.

> NOTE: Scripts are not smart contracts, so code in scripts does not need to be enclosed in the `pub contract ContractName { ... }` block.

### Importing the Smart Contract

To reference our deployed contract `HelloWorld`, we need to load that contract up in the script. In Cadence, we import contracts by doing

```javascript
import ContractName from Address
```

Therefore, in our case, add the following line to the script:

```javascript
import HelloWorld from 0x01
```

This will let us call functions and read variables on the `HelloWorld` contract that's on address `0x01`.

### Writing the main script

The "main" code in a script goes inside a `main` function. Think of it like an entrypoint for your script.

We will create a public main function, that returns a value of type `String` - since we want to return the value of the `greeting` variable.

Add the following code to your script.

```javascript
pub fun main(): String {
    return HelloWorld.greeting
}
```

### Executing our Script

Once this is done, click the `Execute` green button in the top right, and you should see some output in your console at the bottom that looks like this:

```
10:38:46 Script -> Result -> {"type":"String","value":"Hello, World!"}
```

Awesome! We've successfully been able to read the value of the `greeting` variable

### Calling Functions

In the above code, we accessed the variable directly, and we could do that because it was marked as a `pub` variable.

However, we could've also just called the `hello()` function, as that also returns the value of the variable.

Let's quickly edit our script to have the main function be the following:

```javascript
pub fun main(): String {
    return HelloWorld.hello()
}
```

When you try executing this, you will see you get the same result as above.

## 💰 Transactions

Now, let's see how a transaction would work. But first, we need to update our smart contract so we have something to do a transaction for.

### Adding a function that writes data

Go back to `0x01`, and add a new function in the smart contract code.

```javascript
pub fun setGreeting(newGreeting: String) {
    self.greeting = newGreeting;
    log("Greeting updated!")
}
```

However, when you do this, you will quickly be faced with an error.

```
cannot assign to constant member: `greeting`
```

This is because we declared our variable with a `let`. Now, this is going to be confusing for Javascript developers, because `let` in Javascript means a variable that can be changed over time, and `const` means a variable that cannot be changed.

However, in Cadence, `let` is a variable that cannot be changed, and `var` is a variable that can be changed. Keep this quirk in mind as you move forward.

Let's update the declaration of our greeting variable to be as follows:

```diff
- access(all) let greeting: String
+ pub var greeting: String
```

We also changed `access(all)` to `pub` while we were at it, but that has nothing to do with `let` or `var`.

Another cool thing to notice here is we added a `log`. Logs are like `console.log` in Javascript. They're built in to Cadence, and allow you to print statements in the console during function execution. We'll see it's output soon.

Once you do this, you'll see the error magically goes away. Go ahead and deploy the modified contract to the `0x01` account again, and then proceed.

### Understanding a Transaction

In the sidebar, click on `Transaction` under Transaction Templates. You'll see some boilerplate code there that looks like this

```javascript
import HelloWorld from 0x01

transaction {
  prepare(acct: AuthAccount) {}

  execute {
    log(HelloWorld.hello())
  }
}
```

What is this? The `import` statement is fine, but everything else is new.

Remember that in Flow, accounts can store their own data. What I mean by this is you have an NFT, you can store the NFT data directly in the account. On Ethereum, in contrast, the NFT data is stored within the NFT smart contract, along with a mapping containing which address owns which token ID. Unlike that in Flow, the data is genuinely stored directly within the account, not within the contract. Each account has it's own storage.

So, if in a transaction you need to access any data that's stored within the account itself, we need access to the account's storage.

This is what the `prepare` statement is used for. It gives us access to the `acct` variable, of type `AuthAccount`, which gives us access to the storage of the signer of this transaction. During the `prepare` phase, the transaction should access the account's storage and create a reference to that data if needed later on.

In the `execute` phase, we do not directly have access to the account's storage. This phase is used to call functions on smart contracts and such.

### Updating the Greeting

We haven't yet reached the point of learning about account storage in Cadence, and the `HelloWorld` contract clearly does not store anything in the user accounts. So, our `prepare` phase can be left empty.

Update your Transaction code to be the following:

```javascript
import HelloWorld from 0x01

transaction(newGreeting: String) {

  prepare(signer: AuthAccount) {}

  execute {
    HelloWorld.setGreeting(newGreeting: newGreeting)
  }
}
```

The first thing to note is that the `transaction` is taking in an argument - the `newGreeting`. This means the signer of the transaction needs to provide some data to have this transaction work.

Our `prepare` phase is empty because we don't need anything from account storage.

In the `execute` phase, we call the `setGreeting` function on the smart contract.

You should see something like this pop up on the Playground

![](https://i.imgur.com/k7leI0d.png)

Notice that to send the transaction, you need to provide a value for `newGreeting`. Additionally, you can perform the transaction as any one of the five accounts the playground gives us. By default, it must've chosen `0x01`, but you can go ahead and switch to a different Signer if you want.

Since we aren't accessing any data in account storage, it doesn't really matter here which account we choose. Obviously, if this were on mainnet and not in the playground, the account we choose would have to pay transaction fees - so use one which has FLOW tokens.

I'll input a new greeting, select `0x03`, and then click `Send`.

In your console, you should see the `log` we added in the `setGreeting` function. Something like

```
"Greeting updated!"
```

This means our function was successfully run!

### Reading the Greeting

To verify the value was actually updated, go back to your script, and execute it.

If you see something like this in the console (obviously, with a different greeting perhaps), you're good to go!

```
{"type":"String","value":"Are you learning from LearnWeb3, anon?"}
```

## ⏩ Moving Forward

In future lessons, as we keep building, we will learn about more advanced data types in Cadence. Arrays, Dictionaries (Maps), Structs, Optional Variables, etc.

We will also learn about resources, the most important feature of Cadence, and how resources can be stored within account storage.

Until then, have a great day, hope you're enjoying it so far! ❤️