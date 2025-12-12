---
title: "Don't Build Your Own Boot Loader"
date: "2025-12-01"
tags:
  - bootloader
  - systems
  - opinion
slug: not-building-bootloader
excerpt: "Why building your own boot loader is usually not worth the trade-offs."
---

I have been building my x64 playground OS, [ignisOS](https://github.com/ramonasuncion/ignisOS), on and off for the past year. My goal was to understand everything about operating systems, from the boot process to user space.

I started by reading the OSDev wiki on [rolling your own bootloader](https://wiki.osdev.org/Rolling_Your_Own_Bootloader), and it was quite a ride. I spent weeks trying to figure out why my string literals weren't working, only to discover I was just one sector off from reading the kernel even though everything else loaded correctly. Experiences like this are common in OS development, and you can get stuck on a single problem and never move past it. In the end, I did get a somewhat working bootloader ([ignisOS-bootloader](https://github.com/ramonasuncion/ignisOS-bootloader)), but there is a lot missing, and on the kernel side I only have a basic "Hello World."

If your goal is building an operating system, skip the bootloader and focus on the kernel. Use an existing bootloader like GRUB, Limine, or another option. A bootloader is not part of the OS. It is simply a tool to get the system into a state where the kernel can run, and it can be a major distraction. Only create a custom bootloader if you truly need capabilities that existing solutions do not provide.
