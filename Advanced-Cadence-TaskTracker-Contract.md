# Cadence - Build a task tracker

In this level, we will dig a bit deeper into Cadence, and learn about Arrays, Resources, and Account Storage. Resources are probably the most important feature of Cadence, and we will see what unique things they allow, and also how to use resources properly.

We will be creating a contract where every user can manage their own list of tasks they need to do, and can only add/update tasks within their own list - and not in someone else's list.

## 🛝 Flow Playground

We'll continue to use the [Flow Playground](https://play.onflow.org) to write this contract while we are still learning Cadence. Open up the Playground, and go to the `0x01` account, and delete all the default generated code - we'll start from scratch this time.

## 🪵 Resources

Resources are a little bit similar to structs, but not exactly. Cadence does have support for structs as well, but resources allow for certain different things.

If we talk about the differences, structs are really just groupings of data together. They can be created, copied, overwritten, etc. Resources have certain limitations (which allow for certain features) compared to that.

The analogy to think about is that a Resource is like a finite resource in the real world. They are always 'owned' by someone, they cannot be copied, they cannot be overwritten, one resource can only be in one 'position' at a time. We will see what this all means as we begin coding as well.

There is also a loose similarity between Resources in Cadence, and the Ownership model of data in Rust. If you're familiar with Rust, think of resources as similar to owned pieces of data to help you understand.

## 📗 The TaskList Resource

In the `0x01` tab on the playground, add the following starter code and let's understand what is going on.

```javascript
pub contract TaskTracker {

    pub resource TaskList  {
        pub var tasks: [String]
        init() {
            self.tasks = []
        }
    }

}
```

The first thing to notice here is the `pub resource TaskList` declaration. A resource declaration in Cadence is very similar to how you would define structs as well.

The resource itself contains `tasks` - an array of strings (p.s. now you also know the syntax for defining arrays).

Lastly, to note, is that resources need their own `init()` function to initialize values of member variables. In this case, `tasks`. We initialize it to an empty array to begin with.

## 🫱 Resource Creation

Resources need to be created and used very carefully. Resources always live or exist in one 'position' only i.e. you cannot create copies of resources. If you want to move a resource from one 'position' to another, this must be done explicitly, let's see how.

Add a function to your contract above as follows

```javascript
pub fun createTaskList(): @TaskList {
    let myTaskList <- create TaskList()

    // This will not work
    // let newTaskList = myTaskList

    // This will work
    // let newTaskList <- myTaskList

    return <- myTaskList
}
```

There are a lot of interesting things happening in this function above, that explain the concept of resource ownership.

Firstly, note that the `createTaskList` function is returning `@TaskList`. Cadence uses the `@` symbol to signify something is a Resource, not a Struct or another data type.

Then, we have the line `let myTaskList <- create TaskList()`. This line initializes a new `TaskList` resource using the `create` keyword, and then 'moves' it into the `myTaskList` variable. The resource now 'lives' in the `myTaskList` variable and not anywhere else.

If we tried to add a line like `let newTaskList = myTaskList` this will not work. This line would try to 'copy' the `myTaskList` resource, and that is not allowed since a resource can only 'live' in one place at a time.

If you want to move the resource to a different variable, you must do so explicitly using the `<-` move operator. Therefore, `let newTaskList <- myTaskList` will work. At this point, `newTaskList` stores the resource, but ALSO, `myTaskList` becomes a null variable i.e. the resource no longer 'lives' at `myTaskList` - only at `newTaskList`.

Finally, the `return <- myTaskList` statement as well, we need to 'move' the resource out of the variable as we are returning it somewhere else. Presumably, the function caller will be storing it in a variable of their own, so it can no longer 'live' in `myTaskList`.

## 🤔 Why are resources so hard?

Cadence tries to force developers into being very explicit with their resources. This is done to make it really hard for developers to mess up the storage of their resources. If you have a multimillion dollar NFT, you don't want a bug in your code overwriting data in a Struct or Array or something like that, Resources make that impossible. You also don't want that data to be copied over somewhere else by mistake, that is also not possible.

Even to delete resources, you need to explicitly delete them using something like `destroy myTaskList` to destroy the resource entirely. This limitation enforces mindful thinking about the code being written.

## 💾 Account Storage

Each Flow account, not just smart contracts, can store their own data. We talked about this briefly earlier, about how Flow allows NFTs, for example, to be stored directly with the user account in their storage, instead of the smart contract's storage, therefore in case of a smart contract bug the NFT cannot be modified.

The account storage behaves syntactically similar to the storage in any filesystem - think Windows, Linux, or macOS filesystems. Each piece of data (file) has a path (file-path). Data is written to certain paths, and can be read from those paths later on.

There are 3 types of paths, or folders, where data can reside in:
1. `/storage/` - This is private account storage that only the account owner can access
2. `/public/` - This is public storage that is available to everyone
3. `/private/` - This is permissioned storage that is available to the account owner and anyone the owner provides explicit permission to

But how do we actually store things in accounts? Through transactions!

Remember in the last level we were writing transactions in Cadence, and we mentioned that the `prepare` phase of a transaction can be used to read/write data to Account Storage as we have access to the `AuthAccount` there?

Go ahead and deploy the smart contract we have written so far from the `0x01` account in the Playground, and then shift over to the `Transaction` tab. Write the following transaction code, and let's see what's happening.

```javascript
import TaskTracker from 0x01

transaction() {

  prepare(acct: AuthAccount) {
    let myTaskList <- TaskTracker.createTaskList()
    acct.save(<- myTaskList, to: /storage/MyTaskList)
  }

  execute {}

}
```

This time, we're actually using the `prepare` phase of the transaction. We use the `createTaskList` function to create a new `TaskList` resource and 'move' it into the `myTaskList` variable.

Then, we use `acct.save` to write data in our Account Storage, and 'move' the resource from `myTaskList` into Account Storage, at the `/storage/MyTaskList` path.

Later on, in any other transaction, we can use `acct.load` to load the resource from our storage, and do whatever we want with it. We will use this to add/delete tasks in our Task List shortly.

## 🧮 Resource Functions

Resources have this cool thing where they can define their own functions which modify data stored inside the Resource. This is especially useful in cases like ours, where we want each user to only control their own `TaskList`.

Hopefully by now you're starting to see how the flow will look like.

1. User creates a Task List, and saves it to their `/storage/` path.
2. User can add/remove tasks in their personal Task List using Resource-defined functions

Modify the smart contract in `0x01`, and add these two functions *INSIDE* your Resource.

```javascript
pub fun addTask(task: String) {
    self.tasks.append(task)
}

pub fun removeTask(idx: Integer) {
    self.tasks.remove(at: idx)
}
```

At this point, your overall smart contract should look something like this:

```javascript
pub contract TaskTracker {
    pub resource TaskList  {
        pub var tasks: [String]
        init() {
            self.tasks = []
        }

        pub fun addTask(task: String) {
            self.tasks.append(task)
        }

        pub fun removeTask(idx: Integer) {
            self.tasks.remove(at: idx)
        }
    }
    
    pub fun createTaskList(): @TaskList {
        let myTaskList <- create TaskList()
        return <- myTaskList
    }
}
```

Deploy this contract through `0x01`, and now we will create four transaction scripts to
1. Create the TaskList resource and save it in storage
2. Add a task to the resource in the user's storage
3. Remove a task from the resource in the user's storage
4. View all tasks currently stored in the TaskList

## 🤝 All Transactions

We already created the first transaction, to save the `TaskList` resource in `/storage/` above. I will just rename the transaction to `Save Resource` on the Playground to easily identify it (Look for a pencil edit icon next to the transaction name in the sidebar).

Add three more transactions by clicking the `+` button under `Transactions` in the sidebar.

I will name the first one `Add Task`

```javascript
// Add Task Transaction
import TaskTracker from 0x01

transaction(task: String) {

  prepare(acct: AuthAccount) {
    let myTaskList <- acct.load<@TaskTracker.TaskList>(from: /storage/MyTaskList) 
        ?? panic("Nothing lives at this path")
    myTaskList.addTask(task: task)
    acct.save(<- myTaskList, to: /storage/MyTaskList)
  }

  execute {}

}
```

An interesting thing to note here is the `?? panic` syntax when using `acct.load` to load our `TaskList` from storage. This is because Cadence has no idea, pre-execution, whether or not something actually lives at that storage path. It is possible you gave an invalid path, and for that reason `acct.load` might return `nil` (null).

In the case that that happens, you can throw a custom error using the `?? panic(...)` syntax. The `??` operator is called the null-coalescing operator, and also exists in JavaScript. Basically, if the value to the left-hand side of `??` is `nil`, then the right-hand side of `??` is run. In our case, the `panic` statement is run.

The rest of the code is fairly straightforward. We load the `TaskList` from storage, use the resource-defined `addTask` function on it, and then save it back into storage at the same path.

---

Now, for the second transaction, I will name it `Remove Task`, though we will see a different way of accessing storage.

```javascript
// Remove Task Transaction
import TaskTracker from 0x01

transaction(idx: Integer) {

  prepare(acct: AuthAccount) {
    let myTaskList = acct.borrow<&TaskTracker.TaskList>(from: /storage/MyTaskList) ?? panic("Nothing lives at this path")
    myTaskList.removeTask(idx: idx)
  }

  execute {}

}
```

Note, that instead of `.load()` here we used `.borrow()`. Borrow is similar to `load`, except it doesn't actually 'move' the resource out of storage, it just borrows a reference to it.

This is also highlighted by the fact that we did not need to use the `<-` move operator, and an `=` equals operator was good enough. Lastly, the data type for Task List is not defined with an `@TaskTracker.TaskList` and instead uses `&TaskTracker.TaskList`. The `&` symbol signifies this is a reference to the resource, not the resource itself.

Since when we are borrowing we are not actually moving the resource out of storage, we do not need to save it back into storage. We can just call the function on it, and the resource stays where it is.

---

Lastly, I will create a transaction named `View Tasks`

```javascript
// View Tasks Transaction
import TaskTracker from 0x01

transaction() {

  prepare(acct: AuthAccount) {
    let myTaskList = acct.borrow<&TaskTracker.TaskList>(from: /storage/MyTaskList) ?? panic("Nothing lives at this path")
    log(myTaskList.tasks)
  }

  execute {}

}
```

This is similar to the above transaction where we are using `.borrow()`. Then, we just do `log(myTaskList.tasks)` to print all the tasks stored in the TaskList.

## 🕹️ Play Time

Now it's time to go play with your `TaskTracker` contract.

Redeploy the contract from `0x01` to start with a clean slate.

Use `0x02` (or another address) to create the resource using the `Save Resource` transaction that uses `createTaskList`.

Use that same account to add a few tasks, view tasks, remove tasks, and so on.

Congratulations, you've built a tasks tracker where each user can maintain their own personal list of tasks in a resource that is not accessible to others on the network.

The Solidity-equivalent for this would probably have to be a mapping from addresses to an array of strings, where all the logic around who can add/remove tasks to a certain key-value pair of the mapping would need to be in the smart contract. With resources in Cadence, it feels quicker and faster to write such code once you understand the mental model around it.

Today, we learnt about Resources, Arrays, Account Storage, and various ways of reading/writing data to storage. As we proceed, we will use all of these concepts to build our own ENS-like name service on Flow!