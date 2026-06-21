---
title: "Part 1.1: AI Can Think. But Can It Act?"
subtitle: "Control x AI / Why AI Needs Control Theory"
series:
  id: "control-x-ai"
  part: 1
  article: 1
tags: ["automatic-control", "ai", "feedback", "control-loop"]
featured: true
og_title: "Why AI Needs Control Theory: Control x AI Part 1.1"
# og_image: "auto og image generator not yet developed"
---

*This is the first article in Part 1 of the Automatic Control × AI series. If you are new to the series, you might want to start with [Part 0: Why I Started This Series](https://blog.by-hahn.com/posts/control-x-ai-series-part-0).*

---

Imagine a self-driving car that can see everything. Its cameras detect lane markings with perfect accuracy. Its neural network correctly identifies every pedestrian, traffic light, and road sign. The decision system says: turn left here, slow down there, stop at this intersection.

Now imagine that none of those decisions actually reach the wheels.

The car can perceive and think, but it cannot act. It drifts forward, unable to translate its intentions into motion. This is not just a hypothetical failure. In many ways, it is the gap that control theory exists to close.

At its core, control theory is about making systems behave the way we want, even when the real world pushes back.

And once I started looking at AI systems through that lens, control theory stopped feeling like a separate field entirely.

---

## Intelligence Is Not Enough

When most people think about AI, they think about perception and decision-making. A model looks at an image and classifies it. A language model reads a sentence and generates a response. An agent observes a game state and chooses an action.

These are all impressive things, and they are genuinely difficult problems to solve.

But in robotics, manufacturing, aerospace, and almost any system that interacts with the physical world, there is another step after the decision itself. That step is execution. And execution is where control theory lives.

A robotic arm, for example, does not simply receive a command like "move to position X" and arrive there perfectly. The arm has mass. Its joints have friction. The motors respond to electrical signals with delay and limitations. The world pushes back constantly, and if the system does not account for those dynamics, the arm may overshoot the target, oscillate back and forth, or react so slowly that it becomes unusable.

This is the problem automatic control was built to solve.

Not perception.  
Not decision-making.  
But the problem of turning decisions into reliable physical action.

---

## Two Ways to Act: Open-Loop and Closed-Loop

To understand why feedback matters so much, let's start with the simplest kind of system possible.

### Acting Without Feedback: Open-Loop

Suppose you want to heat a room to exactly 72 degrees Fahrenheit. One approach is to turn on the heater for a fixed amount of time based on a rough estimate. You decide that running it for 30 minutes should be enough, and then you walk away without checking anything.

This is called an **open-loop system**.

The system receives an input, performs an action, and assumes the result will be correct. There is no feedback from the actual outcome. If the room is colder than expected, or if someone opens a window, the system has no idea.

A simple toaster works this way. You set a timer, the coils heat for a fixed duration, and the bread pops up. Open-loop systems can work surprisingly well when the environment is predictable.

But the real world is rarely predictable.

### Acting With Feedback: Closed-Loop

Now consider a thermostat.

Instead of blindly heating the room for a fixed amount of time, the thermostat continuously measures the actual temperature. If the room is too cold, the heater turns on. If the room becomes too warm, the heater turns off.

The system constantly compares reality against the target and adjusts itself accordingly.

This is called a **closed-loop system**, also known as a feedback control system.

---

```
Observe → Compare → Correct → Repeat
```

---

That comparison step is everything.

The difference between what you want and what the system actually produces is called the **error signal**. A feedback controller exists to reduce that error over time.

The idea sounds simple, but once you notice feedback loops, you start seeing them everywhere.

---

## Feedback Is Everywhere in AI

One of the reasons control theory became much more interesting to me is that feedback loops already exist in many AI systems, even if we do not always describe them that way.

### Reinforcement Learning

Take reinforcement learning as an example. An agent performs an action, observes the result, receives a reward signal, and adjusts its future behavior based on whether things improved or got worse.

In a very real sense, the reward signal acts like an error signal. The system is continuously trying to reduce the gap between its current behavior and some desired outcome.

The structure is surprisingly similar to feedback control.

### Self-Driving Systems

The same idea appears in self-driving systems.

A car observes its position relative to lane markings, computes how far it has drifted from the center, and applies a steering correction. That correction changes the vehicle's position, the sensors observe the updated state, and the process repeats continuously.

---

```
Perception → Decision → Control
```

---

The perception system detects the environment. The decision system determines the intended behavior. But the control system is what translates that intention into steering angles, motor commands, and physical movement.

And this turns out to be much harder than it sounds.

If the feedback loop is poorly designed, the car may overcorrect repeatedly, weaving from side to side instead of driving smoothly. Even perfect perception does not guarantee stable behavior.

This is because the physical world introduces dynamics that software alone cannot ignore. Cars have momentum. Steering systems have delay. Tires interact with the road differently depending on speed, weather, and surface conditions.

The intelligence may exist entirely in software, but the behavior emerges from physics.

---

## The Part People Often Overlook

There is a reason control theory often receives less attention in discussions about AI.

Decision-making is visible. You can watch a model classify an image or generate text. You can compare benchmark scores and demos. The outputs are easy to show.

Control is mostly invisible.

When it works, systems simply behave the way you expect. A robot arm moves smoothly. A drone stabilizes itself. A vehicle stays centered in its lane.

When it fails, the failure often looks mechanical rather than computational. The arm shakes. The drone drifts. The car oscillates.

But that invisibility is part of what makes control theory so interesting to me. It is the layer of the system that has to negotiate directly with reality.

A machine learning model can operate on clean datasets and abstract representations. A controller, however, has to deal with friction, inertia, delay, uncertainty, and noise in real time.

And no matter how capable AI becomes, physical systems will still have to obey physics.

---

## Where AI and Control Meet

When I first started studying AI, I assumed control theory belonged to a completely different world. It felt mechanical and distant from the kinds of problems I cared about.

Over time, that distinction started to disappear.

AI without control is a system that can think but cannot act. Control without intelligence is a system that can act but cannot adapt.

The systems that actually function in complex environments need both.

And the more I study physical AI systems, robotics, and autonomous systems, the more it feels like the boundary between AI and control theory is becoming increasingly difficult to separate.

---

## What Comes Next

If control theory is about making physical systems behave the way we want, then the next question becomes unavoidable:

How do we mathematically describe the behavior of those systems in the first place?

Before we can design a controller for a robot arm, a drone, or even a simple motor, we first need a model of how the system responds to forces, signals, and movement over time.

That is what the next article explores.

And surprisingly, many systems that seem completely unrelated physically end up looking mathematically similar once you start modeling them carefully.
