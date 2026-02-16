---
title: "Making the Switch to Emacs"
date: "2026-02-16"
slug: making-the-switch-to-emacs
---

I used [Neovim](https://neovim.io/) throughout my undergrad. But I'm making the switch to Emacs. Why? Why not. I'm still going to use Vim for basic edits since I use Emacs in GUI mode, but for any sort of systems programming, I think I'm going to give Emacs a try. I am hesitant to say full-time because I do still use VSCode for any sort of web development. But who knows. I might move that over too.

If you plan on using my dotfiles they're on my [github](https://github.com/ramonasuncion/.dotfiles). Just remember to update:

```
M-x elpaca-update-all
```

The keybinds I use:

## Basics

How I navigate in Emacs.

- `C-x C-f`: open a file (you can create files too)
- `C-x b`: switch buffer
- `C-x k`: kill buffer
- `C-x 0`: close current window
- `C-x 1`: close all other windows
- `C-x 2`: split horizontal
- `C-x 3`: split vertical
- `C-x o`: switch window
- `C-w h/j/k/l`: switch window (evil)
- `C-x d`: open dired (file manager)
- `C-x C-m`: execute command (M-x)

Everything below isn't important for normal programming, but they are part of my workflow to make me a 100x developer with file navigation, git, and building and running.

## File Navigation

- `C-c e`: recent files
- `C-c s`: search lines in buffer (consult-line)
- `C-c S`: search lines in buffer (consult-grep)
- `F5`: deadgrep (ripgrep search)
- `C-c f`: copy current file path
- `C-c d`: copy current dir path

## Dired

If there is one thing I love in this world more than salted caramel, it's Dired.

- `Enter`: open file/dir
- `^`: go up a dir
- `+`: create a dir
- `d`: mark for deletion
- `x`: execute deletions
- `R`: rename/move
- `C`: copy

## Magit

I'm still opening up a separate terminal and using git from time to time. I'll learn this eventually.

- `C-x g`: magit status
- `s`: stage file/hunk (in magit)
- `u`: unstage
- `c c`: commit
- `P p`: push
- `F p`: pull
- `b b`: switch branch
- `l l`: log
- `d d`: diff

## Building and Running

I'm typically programming in C++ and C, so I set it up to build with Make/CMake.

- `C-c b`: build project
- `C-c r`: run project
- `F7`: recompile
- `C-c t`: open terminal in project root

## Errors

To hop between live LSP errors:

- `]d/[d` next error / prev error

And in the build/compile errors when building the project after running `C-c b` / `F7`:

- `M-g n/M-g p` (next-error/previous-error)

I'm leaving out multiple cursors since I'm testing a set of keybinds.
