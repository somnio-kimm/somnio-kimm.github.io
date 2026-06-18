---
title: "Convex Optimisation"
category: "Mathematics"
subcategory: "Optimisation"
excerpt: "Convex sets and functions, the convex problem, and Lagrangian duality."
tags:
  - Math
  - Optimisation
---

## Convexity

A problem is convex when the feasible set is convex **and** the objective is convex.

- A choice of $x$ is feasible if it satisfies all constraints. The feasible set is convex if, whenever $x, y$ are feasible, every point on the segment $tx + (1-t)y$ is also feasible.
- A function $f$ is convex if, for all $x, y$ in its domain and all $t \in [0, 1]$,

$$
f(tx + (1-t)y) \leq t f(x) + (1-t) f(y)
$$

If $f$ is twice differentiable, convexity is equivalent to the Hessian being **positive semi-definite (PSD)**. A real symmetric matrix $A \in \mathbb{R}^{n \times n}$ is PSD if $x^{\mathsf{T}} A x \geq 0$ for all $x \in \mathbb{R}^{n}$. Equivalently, for symmetric real $A$:

- all eigenvalues are non-negative;
- a factorisation $A = B^{\mathsf{T}} B$ exists, so $x^{\mathsf{T}} A x = x^{\mathsf{T}} B^{\mathsf{T}} B x = \| Bx \|^{2} \geq 0$;
- all principal minors are non-negative. (A minor is the determinant of a submatrix; the principal submatrix $A[S, S]$ keeps the rows and columns indexed by $S \subseteq \{1, \dots, n\}$.)

## Convex problem

$$
\min_{x} f_{0}(x) \quad \text{s.t.} \quad f_{i}(x) \leq 0,\ i = 1, \dots, m, \quad h_{j}(x) = 0,\ j = 1, \dots, p
$$

with convex $f_{0}, f_{i}$ and affine $h_{j}$. A function is affine if it can be written $f(x) = Ax + b$; composing a convex function with an affine map preserves convexity. A set $C$ is affine if, for all $x_{1}, x_{2} \in C$, the entire line through them stays in $C$. In a convex problem, **any local minimum is a global minimum**.

## Duality

For the primal problem $\min_{x} f_{0}(x)$ s.t. $f_{i}(x) \leq 0$ and $Ax = b$:

**1. Form the Lagrangian** (penalised objective) with multipliers $\lambda_{i} \geq 0$ for the inequality constraints and free-sign $\nu$ for the equality constraints:

$$
L(x, \lambda, \nu) = f_{0}(x) + \sum_{i=1}^{m} \lambda_{i} f_{i}(x) + \nu^{\mathsf{T}}(Ax - b)
$$

This is the original cost plus weighted penalties for constraint violation.

**2. The dual function** gives a guaranteed lower bound:

$$
g(\lambda, \nu) = \inf_{x} L(x, \lambda, \nu)
$$
