---
title: "Syntax is a Trap"
description: "Your language's semantics matter far more than its syntax."
slug: syntax-is-a-trap
---

I’ve been designing a new system language called [Ripe](https://github.com/ripe-lang), and I’ve fallen into a trap of trying to invent a ‘unique’ syntax for my language before I’ve written a line of code. I’m writing this so you don’t waste as much time as I did. 🥲

Syntax uniqueness doesn’t exist and doesn't matter. Every language shares some commonality with others: braces for blocks, parentheses for calls, and colons or keywords for types. This is done on purpose. If someone picks up your language, the last thing they want to find out is that you've replaced curly braces for blocks with square brackets just to be different. Sorry, esolangs.

The truth is, there are only so many readable ways to write: `variable [something] type [something] value`

You can do:

- `int x = 42` (C)
- `let x: int = 42` (Rust)
- `var x int = 42` (Go)

And how Ripe is going to do it: `let x: int = 42`.

What actually makes languages different is not the syntax, but the **semantics**.

- **Zig** has no hidden allocations.
- **Rust** has an ownership system.
- **Go** has goroutines and interfaces.

You see? 👀 Your language will be different because of how you handle memory, how you manage errors, and what you forbid—not because you used a `:` to define a variable.

So, go get the compiler working! The language design will reveal itself when you actually start using it. Now, I’m off to build the lexer. I'm starting with this:

```c
func main(): int {
    return 42
}
```

My road map is simple:

- Integer types
- Variables
- Return type
- One function

As the weeks go on, I’ll add expressions, control flow, and loops. From there, I can start figuring out what I really want this language to be: string handling, memory management, pointers, structs, and generics.

But for now, just getting integers working is my main focus. One last thing: early on, **transpile to C**. It saves you from getting stuck in LLVM boilerplate before you’ve even gotten a basic 'Hello World' to run. Godspeed. 😎
