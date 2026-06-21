---
title: "Part 1.2: The World as Equations"
subtitle: "Control x AI / Modeling the Physical World"
series:
  id: "control-x-ai"
  part: 1
  article: 2
tags: ["automatic-control", "ai", "modeling", "transfer-function", "simulation"]
featured: true
og_title: "Modeling the Physical World: Control x AI Part 1.2"
# og_image: "auto og image generator not yet developed"
---

*This is the second article in Part 1 of the Automatic Control × AI series. The previous article, [Part 1.1: AI Can Think. But Can It Act?](https://blog.by-hahn.com/posts/control-x-ai-series-part-1-1), introduced the idea of feedback and why control systems exist. This article builds directly on that foundation.*

---

Before a robotics company deploys a new robotic arm, it almost never tests directly on the physical hardware first. The arm is trained, tuned, and evaluated inside a simulation. Thousands of hours of movement happen in a virtual environment, against virtual objects, with virtual physics. The physical hardware only enters the picture after the system has proven itself inside that simulated world.

That might seem like a practical workaround, but it is actually pointing at something more fundamental.

A simulation is not a recording of reality. It is a mathematical description of how things move, push back, and respond to force. The physical world is replaced by equations, and those equations have to be good enough that behavior in the virtual environment transfers to behavior in the real one.

This process, turning a physical system into a mathematical model, is the foundation of control theory. And it turns out that without it, neither AI nor control can do very much at all.

---

## Why Models Come First

At the end of the previous article, I mentioned that physical systems which seem unrelated often end up looking surprisingly similar once you model them mathematically. That observation deserves some unpacking, because it is not obvious why that would be true.

When we want to control a system, whether it is a robot joint, a temperature regulator, or a vehicle, we need to be able to predict how it will respond. If I apply a certain force, how far does it move? If I increase a voltage, how does the current change? If I turn on a heater, how quickly does the temperature rise?

Without a model, control becomes guesswork. You adjust something, observe what happens, and hope for the best. That might work for simple tasks in predictable environments, but it falls apart quickly once the system becomes more complex or the environment becomes less forgiving.

A mathematical model lets us do something much more useful. We can predict a system's behavior, test a controller against it, and identify problems without any risk of breaking expensive hardware or, in more critical applications, harming anyone.

That is exactly what simulation environments in robotics are doing. The model is not an approximation we tolerate because hardware is inconvenient. It is a fundamental tool for thinking about how a system works.

---

## Starting Simple: Mass, Spring, and Damper

The most common introductory model in control theory is the **mass-spring-damper system**, and for good reason. It is physically intuitive, mathematically clean, and it captures the core dynamics that appear in a surprising number of real systems.

### Three Forces at Work

Picture a block sitting on a frictionless surface. The block is attached to a wall by a spring, and also to a damper, which you can think of as a shock absorber. When you push the block, three forces come into play.

First, the spring pulls back. The further you push, the harder it resists. This is the restoring force, and its strength depends on the **spring constant**, which tells you how stiff the spring is.

Second, the damper resists motion. The faster the block moves, the harder the damper pushes back. This is the resistive force, and its strength depends on the **damping coefficient**, which tells you how much the system resists rapid movement.

Third, there is the block itself. Mass resists changes in velocity. To accelerate a heavier object, you need more force.

### Writing It as a Differential Equation

Put these three together, and you get a relationship between the force you apply and the position of the block over time. Written as a differential equation, the core relationship looks like this:

$$
m\ddot{x}(t) + c\dot{x}(t) + kx(t) = F(t)
$$

Where $m$ is mass, $c$ is the damping coefficient, $k$ is the spring constant, $x(t)$ is the position of the block at time $t$, and $F(t)$ is the force you are applying.

The dot notation, $\dot{x}$ and $\ddot{x}$, represents rates of change. $\dot{x}$ is velocity, which is how quickly position is changing. $\ddot{x}$ is acceleration, which is how quickly velocity is changing. Newton's second law, F equals ma, is hiding inside that equation.

**The differential equation above** says that the total force acting on the block at any given moment is the sum of the force from mass resisting acceleration, the force from the damper resisting velocity, and the force from the spring pulling it back toward the center.

That is the model. A set of equations that describes how the system evolves over time.

---

## The Surprising Part

Consider an electrical circuit with a resistor, an inductor, and a capacitor connected in series. This kind of circuit is known as an **RLC circuit**, short for resistor-inductor-capacitor. When you apply a voltage to this circuit, the electrical behavior of the system can be described by tracking the charge accumulated on the capacitor over time. That relationship follows this equation:

$$
L\ddot{q}(t) + R\dot{q}(t) + \frac{1}{C}q(t) = V(t)
$$

Where `L` is inductance, `R` is resistance, `C` is capacitance, `q(t)` is the electric charge accumulated on the capacitor at time $t$, and `V(t)` is the applied voltage.

Look at the two equations side by side.

$$
\begin{aligned}
m\ddot{x} + c\dot{x} + kx &= F(t) \quad \text{[mechanical]} \\
L\ddot{q} + R\dot{q} + \tfrac{1}{C}q &= V(t) \quad \text{[electrical]}
\end{aligned}
$$

The structure is identical. At first glance, these two systems do not feel related at all. One involves physical motion, springs, and dampers. The other involves current, voltage, and electrical components. But mathematically, they behave like the same system wearing different physical forms. The symbols are different, and the physical meaning of each term is different, but the mathematical form is the same. A second-order linear differential equation with three terms on the left and a driving input on the right.

Mass corresponds to inductance. Damping corresponds to resistance. Spring stiffness corresponds to the inverse of capacitance. Force corresponds to voltage.

This is why models matter so much in control theory. Once you recognize that a mechanical system and an electrical system share the same mathematical structure, everything you learn about one applies directly to the other. A control technique developed for an electrical circuit works on a robot joint that follows the same equations, because the equations do not care about what is physically happening. They only care about the structure of the dynamics.

This abstraction is part of what makes control theory so general.

---

## From Differential Equations to Transfer Functions

Differential equations are precise, but they are not always the most convenient way to think about a system. Especially when you want to understand how a system responds to different kinds of inputs, or how a controller will change its behavior.

### The Laplace Transform

Engineers use a mathematical tool called the **Laplace transform** to convert differential equations into a more workable form. I will not go deep into the mechanics of the Laplace transform here, because the intuition is more important than the derivation. The key idea is straightforward. In the transformed domain, which engineers call the **s-domain**, differential equations become ordinary algebraic equations. That shift matters because algebraic equations are far easier to manipulate than differential ones. Instead of solving for how a signal evolves step by step through time, you can reason about the system's overall behavior using straightforward algebra.

The variable $s$ itself is a complex number, and that turns out to be useful. The real part of $s$ captures whether a signal is growing or decaying over time, and the imaginary part captures oscillation. A system that rings like a bell and gradually settles has both of those things happening at once, and $s$ encodes them together in a single symbol.

### The Transfer Function

The result of applying this transform to a system's differential equation is called the **transfer function**.

A transfer function describes the relationship between a system's input and its output in a compact, symbolic form. For the mass-spring-damper system, the transfer function from applied force to position takes this form.

$$
G(s) = \frac{X(s)}{F(s)} = \frac{1}{ms^2 + cs + k}
$$

Where $X(s)$ is the Laplace transform of the position and $F(s)$ is the Laplace transform of the applied force. This assumes the system starts from rest, which is the standard convention when first analyzing a system's behavior.

The transfer function $G(s)$ is essentially a shorthand for asking: if I give this system an input signal, how does it transform that signal into an output? A system with a high spring constant and heavy damping will respond very differently to the same force compared to a light, loosely damped system. The transfer function captures that difference in a single expression.

Once we have a transfer function, system analysis becomes dramatically easier. Instead of solving differential equations repeatedly from scratch, we can reason about behavior using algebraic tools. Stability, response speed, oscillation, and controller design all become much more approachable in this form.

The concepts covered in the rest of this series, stability, response characteristics, frequency behavior, and controller design, all build on this foundation.

---

## The AI Connection: Building Worlds from Equations

When I first started thinking about simulation environments in the context of AI, I thought of them primarily as engineering conveniences. Simulation is faster than hardware, cheaper, and safer.

But looking at it through the lens of modeling, I started to see something deeper.

Platforms like MuJoCo and Isaac Sim, widely used for training robotic systems, are essentially physics engines. They simulate the dynamics of rigid bodies, joints, friction, contact forces, and gravity by numerically solving differential equations of exactly the kind described above. When a robotic arm learns to reach a target in simulation, it is interacting with a mathematical model of how mass, force, and motion relate to each other.

The model is the world. And the quality of the model determines whether anything learned in simulation transfers to reality. This problem even has a name in the robotics community. It is called **sim-to-real transfer**, and it refers to the challenge of bridging the gap between a simulated model and the real physical system it represents.

A well-modeled simulation earns its claims. Joints resist at the right angles, mass distributes realistically, contact forces push back as expected. When the model is off, those errors quietly slip through, and what looked reliable on screen starts falling apart the instant it meets the actual hardware.

This is another version of the same problem control engineers have always dealt with. The model is never perfectly accurate, and the mismatch between model and reality is something that both classical control design and modern AI training have to account for in different ways.

### Physics-Informed Neural Networks

There is also a newer and more direct connection. A growing body of research uses physical models not just as simulation environments but as ingredients inside learning itself. **Physics-informed neural networks**, for example, incorporate known physical equations as constraints or regularizers during training. Instead of asking a neural network to learn physical behavior entirely from data, you embed what you already know from modeling, equations like the ones above, directly into the learning process.

The idea is that physical laws are not things the model should have to rediscover from scratch. They are prior knowledge. And encoding them properly can make learning faster, more data-efficient, and more likely to generalize.

This connection between mathematical models and learning algorithms is something I expect to keep coming back to throughout this series.

---

## One Model, Many Systems

Once you start recognizing these structures, the world begins to look slightly different. Systems that once seemed unrelated start collapsing into the same mathematical patterns.

I want to end on the observation that I find most striking about modeling.

The mass-spring-damper structure appears everywhere. Suspension systems in cars. Human joints under load. Atomic bonds vibrating at the molecular scale. The same RLC structure describes audio filters, antenna circuits, and power regulators. Different physical phenomena, same underlying form.

This is not a coincidence. It reflects something about the nature of physical systems: many of them involve competing forces, inertia, and dissipation in some combination. Once you recognize that pattern in one place, you start seeing it everywhere else.

For a control engineer, this is useful because it means that a technique that works for one class of systems likely works for another. For an AI researcher, it suggests that learning a good model in one physical domain might transfer to others more readily than it first appears.

Underneath the springs and circuits and atomic bonds, the same pattern keeps appearing. The mathematics does not distinguish between them. It just describes the shape of the dynamics, wherever they happen to occur.

---

## What Comes Next

Now that we have a way to model a system, a natural question follows immediately.

How does that system actually behave? Not just in theory, but in terms of what you would observe watching it respond to an input. Does it overshoot? Does it settle slowly? Does it oscillate before coming to rest?

These are questions about system response, and they turn out to be just as important as the model itself. Because a system that is modeled correctly but behaves undesirably is still a system you cannot rely on.

That is what the next article will explore.