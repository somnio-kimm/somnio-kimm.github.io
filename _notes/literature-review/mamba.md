---
title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces"
category: "Literature Review"
subcategory: "Efficient Sequence"
excerpt: "A selective state-space model: linear-time sequence modelling with input-dependent SSM dynamics, HiPPO initialisation, and a parallel selective scan."
tags:
  - ML
  - DL
  - Sequence Models
  - SSM
  - Paper Notes
---

## State-space model

![State-space representation](/images/notes/mamba-1.png)

A continuous linear time-invariant (LTI) state-space system:

$$
\dot{x}(t) = A x(t) + B u(t), \qquad y(t) = C x(t) + D u(t),
$$

with state $x$ (the system's memory), input $u$, output $y$. The discrete form is $x_{t+1}=Ax_t+Bu_t$, $y_t=Cx_t+Du_t$ ($Du_t$ is a residual). Unrolling with $x_0=0$:

$$
x_t = \sum_{k=0}^{t-1} A^k B\,u_{t-1-k}, \qquad y_t = \sum_{k=0}^{t-1} K_k\,u_{t-1-k},\quad K_k = CA^kB,
$$

so the recurrence is also a **convolution** with kernel $K$.

## Discretisation

![Discretisation schemes](/images/notes/mamba-2.png)

$\dot x = Ax+Bu$ discretises to $x_{k+1}=\bar A x_k + \bar B u_k$ in several ways:

- **Zero-order hold:** $\bar A = e^{A\Delta}$, $\bar B = \big(\int_0^\Delta e^{A\tau}d\tau\big)B = A^{-1}(e^{A\Delta}-I)B$ (piecewise-constant input, learned step $\Delta$).
- **Forward Euler:** $x_{k+1}=(I+\Delta A)x_k+\Delta B u_k$ — eigenvalues $1+\Delta\lambda$, unstable for large $\Delta$.
- **Backward Euler:** $x_{k+1}=(I-\Delta A)^{-1}(x_k+\Delta B u_{k+1})$ — eigenvalues $(1-\Delta\lambda)^{-1}$, always stable for $\Re(\lambda)<0$.
- **Bilinear (Tustin):** maps the left half-plane to the unit disk (stable ↔ stable).
- **RK4:** fourth-order accuracy.

## Why SSMs

- **Transformer:** $O(L^2)$ attention; fast parallel training, slow inference.
- **RNN:** linear cost, but hard to train (vanishing/exploding) and poorly parallel.
- **CNN:** parallelisable, but awkward at inference.

An SSM uses the **convolutional** form during training and the **recurrent** form during inference — possible only because the system is LTI ($A,B,C$ fixed across time).

## HiPPO

Computing $A^k$ is expensive, and $A$ must capture long-range dependencies without blowing up. **HiPPO** parameterises $A$ so the state compresses the input history into coefficients of a polynomial (Legendre) basis:

$$
x_n(t) \approx \int_0^t f(s)\,P_n\!\big(\tfrac{s}{t}\big)\,ds.
$$

Differentiating (Leibniz rule) and applying Legendre recurrences yields $\frac{d}{dt}x(t)=\frac1t A x(t)+Bf(t)$ with a **lower-triangular** HiPPO matrix $A$ (since $\dot x_n$ depends only on $x_0,\dots,x_n$). Log-time scaling $\tau=\log t$ removes the $1/t$ factor, restoring a time-invariant $A$. The state then always holds a polynomial summary of the past.

## Selective scan

S4's $A,B,C$ are fixed — independent of the input. **Mamba** makes them input-dependent via gates:

$$
x_{t+1} = f(u_t)\odot(Ax_t) + g(u_t)\odot(Bu_t) = \alpha_t\odot x_t + \beta_t\odot u_t,
$$

so each step chooses how much past to keep ($\alpha_t$) and how much input to inject ($\beta_t$). Expanding,

$$
x_t = \sum_{k=0}^{t}\Big(\prod_{j=k+1}^{t}\alpha_j\Big)\odot\beta_k u_k,
$$

where the prefix products $\prod\alpha_j$ are computed efficiently by a parallel **scan**. Because the dynamics are now content-dependent (not LTI), the convolutional form no longer applies — hence the hardware-aware selective scan.

## References

- [arXiv:2312.00752](https://arxiv.org/abs/2312.00752)
- Videos: [1](https://www.youtube.com/watch?v=N6Piou4oYx8), [2](https://www.youtube.com/watch?v=BDTVVlUU1Ck), [3](https://www.youtube.com/watch?v=8Q_tqwpTpVU)
