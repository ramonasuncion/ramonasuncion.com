---
title: "Don't Build Your Own Bootloader"
date: "2025-12-01"
tags:
  - bootloader
  - systems
  - opinion
slug: not-building-bootloader
excerpt: "Why building your own bootloader is usually not worth the trade-offs."
---

My experience building a small bootloader.

## Journey

I have been building my x64 playground OS, [ignisOS](https://github.com/ramonasuncion/ignisOS), on and off for the past year. My goal was to understand everything about operating systems, from the boot process to user space.

I started by reading the OSDev wiki on [rolling your own bootloader](https://wiki.osdev.org/Rolling_Your_Own_Bootloader), and it was quite a ride. I spent weeks trying to figure out why my string literals weren't working, only to discover I was just ONE sector off from reading the kernel even though everything else loaded correctly. 

```nasm
; Load 10 sectors (was 9) from disk
mov cl, 0x0A
```

Call this what this is — skill issue. 🫠

## Lessons Learned

Experiences like these aren't just limited to working on a bootloader. But there is still a lot missing! What about file system support? Support for ELF? 🤔 You can spend all your time just working on the bootloader. 

In the end, I did get a somewhat working bootloader ([ignisOS-bootloader](https://github.com/ramonasuncion/ignisOS-bootloader)), but on the kernel side I only have a basic "Hello World."

```c
#include "drivers/vga.h"

void kmain()
{
    kprint("Hello, world!");
    for (;;) asm volatile("hlt");
}
```

## Recommendation

**Pro tip: skip the bootloader and focus on the kernel!**

Use an existing bootloader like GRUB, Limine, or another option and move quickly. A boot loader is not part of the OS. It's simply a tool to get the system into a state where the kernel can run, and it can be a major distraction. Only create a custom bootloader if you truly need capabilities that existing solutions don't provide.
