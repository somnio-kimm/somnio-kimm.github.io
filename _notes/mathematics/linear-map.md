---
title: "Linear Map"
category: "Mathematics"
subcategory: "Linear Algebra"
excerpt: "Structure-preserving maps between vector spaces: additivity and homogeneity."
tags:
  - Math
  - Linear Algebra
---

A **linear map** between vector spaces $V$ and $W$ over the same field $F$ is a function $L : V \to W$ such that, for all $v_1, v_2 \in V$ and all $c \in F$:

1. **Additivity:** $L(\mathbf{v}_1 + \mathbf{v}_2) = L(\mathbf{v}_1) + L(\mathbf{v}_2)$
2. **Homogeneity:** $L(c\mathbf{v}_1) = c\,L(\mathbf{v}_1)$

**Examples.**

- $L : \mathbb{R}^2 \to \mathbb{R}$, $(x, y) \mapsto ax + by$ for $a, b \in \mathbb{R}$ — linear.
- $L(x, y) = x^2 + y$ — **not** linear.
- $L : \mathbb{R}^2 \to \mathbb{R}^2$, $(x, y) \mapsto (y, x)$ — linear.
- $L : C^1([-1, 1]) \to C^0([-1, 1])$, $f \mapsto f'$ (differentiation) — linear, where $C^1([-1,1]) = \{ f \in C^0([-1,1]) \mid f \text{ has a continuous derivative} \}$.

**Propositions.**

- Any $m \times n$ matrix $A$ determines a linear map from $\mathbb{R}^n$ to $\mathbb{R}^m$.
- If $V$ and $W$ are finite-dimensional, $L$ can be represented by a matrix.

A **linear system** is

$$
\begin{cases}
a_{11}x_1 + a_{12}x_2 + \cdots + a_{1n}x_n = b_1 \\
a_{21}x_1 + a_{22}x_2 + \cdots + a_{2n}x_n = b_2 \\
\quad\vdots \\
a_{m1}x_1 + a_{m2}x_2 + \cdots + a_{mn}x_n = b_m
\end{cases}
$$

and each solution to the system is a vector.
