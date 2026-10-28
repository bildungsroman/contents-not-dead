---
title: Recursive Overflow
summary: A call stack climbs through the screen until the machine runs out of room - and then keeps going.
authors: [Studio CND]
date: '2026-10-23'
tags: [art, software, recursion]
type: image
access: paid
image: recursive-stack-overflow.png
preview: /previews/recursive-stack-overflow.png
---

**Recursive Overflow** makes a runtime failure physical: every new frame becomes
another floor, every function call another staircase, and every return address
one more sheet waiting to fall.

In a real program, a stack overflow happens when nested calls exhaust the
memory reserved for the call stack. Here, the boundary is architectural. The
machine cannot contain the structure it has been asked to remember.
