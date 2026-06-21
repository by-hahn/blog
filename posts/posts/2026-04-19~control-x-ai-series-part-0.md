---
title: "Part 0: Why I Started This Series"
subtitle: "Control x AI Part. 0"
series:
  id: "control-x-ai"
  part: 0
  article: 1
tags: ["automatic-control", "ai", "series-intro"]
featured: true
og_title: "Why I Started This Series: Control Theory and AI"
# og_image: "auto og image generator not yet developed"
---

There is a question I kept coming back to during the first few weeks of this semester.

I am studying Artificial Intelligence at the School of Electronics Engineering, and this term I enrolled in a course called Automatic Control. On the surface, these two things do not seem to belong together. Control theory is old, rooted in mechanical engineering and the age of steam regulators and analog circuits. AI feels like the opposite of that: fast-moving, data-driven, and seemingly everywhere at once. So when I sat down in that first lecture, part of me was genuinely wondering what any of this had to do with what I actually care about.

The answer came slowly, and it surprised me.

The more I studied control systems, the more I kept seeing echoes of concepts I already knew from machine learning. **Feedback loops** that looked a lot like gradient updates. **Stability conditions** that reminded me of questions about whether a trained model would behave reliably in deployment. **Mathematical representations of system state** that felt almost identical to how a neural network transforms an input. These were not loose analogies or surface-level similarities. They were the same underlying ideas, arriving from two very different directions and meeting somewhere in the middle.

**That is what this series is about.**

---

## The Central Question

How does an intelligent system actually move something in the real world? Not how it perceives the world, and not how it makes a decision, but how that decision becomes physical action. A robot lifting an arm. A car staying in its lane. A drone holding its position in wind. These things do not happen by accident, and they require more than a good model or a clever algorithm. They require control.

What I want to do across these articles is build up that picture piece by piece, in the order that made sense to me as I was learning it.

---

## What This Series Covers

- **Part 1: Why Control Matters for AI** is where we get comfortable with the basics. What even is a control system, how do we describe a physical system in a way a computer can reason about, and what does it mean for something to move well versus barely hold together? I spent more time on this part than I expected, because getting the intuition right here makes everything else much easier to follow.

- **Part 2: Designing Control Systems** is where things get more hands-on. Once we understand how systems behave, the natural next question is how to actually design them to behave the way we want. This is where some of the most widely used tools in engineering show up, and also where I started noticing real similarities with decisions I had already made in AI projects without fully realizing it.

- **Part 3: Control Meets Modern AI** is where the two fields start to look genuinely similar, not just in spirit but in the actual mathematics. This part was the most surprising to me, and it is the reason I wanted to write the series in the first place.

---

## A Note on Who This Is For

I am not writing this as an expert. I am writing it as a student who found something genuinely surprising in a subject that he did not expect to care about, and who wanted to record that discovery in a way that might be useful to someone else starting from the same place. If something was not obvious to me at first, I will say so directly rather than smooth it over.

You do not need an engineering background to follow along. You just need to be curious about how AI connects to the physical world. That is enough to get started.

**That is where we begin.**