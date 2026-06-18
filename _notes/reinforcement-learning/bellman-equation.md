---
title: "Bellman Equation"
category: "Reinforcement Learning"
subcategory: "Foundations"
excerpt: "Deriving the Bellman equations for the state-value and action-value functions, line by line."
tags:
  - ML
  - RL
---

The Bellman equation expresses each value function recursively, relating the value of a state (or state–action pair) to the values of its successors.

**State-value function.**

$$
\begin{alignat*}{2}
v_{\pi}(s)
&= \mathbb{E}_{\pi}[G_t \mid S_t=s]
&& \quad \text{definition of value function} \\
&= \mathbb{E}_{\pi}[R_{t+1} + \gamma G_{t+1} \mid S_t=s]
&& \quad \text{recursive form of return} \\
&= \sum_{a} \pi(a \mid s)\, \mathbb{E}_{\pi}[R_{t+1} + \gamma G_{t+1} \mid S_t=s, A_t=a]
&& \quad \text{law of total expectation} \\
&= \sum_{a} \pi(a \mid s) \sum_{s'} \sum_{r} p(s', r \mid s, a)\, \mathbb{E}_{\pi}[R_{t+1} + \gamma G_{t+1} \mid S_t=s, A_t=a, S_{t+1}=s', R_{t+1}=r]
&& \quad \text{law of total expectation} \\
&= \sum_a \pi(a \mid s) \sum_{s'} \sum_{r} p(s', r \mid s, a)\,(r + \gamma\, \mathbb{E}_{\pi}[G_{t+1} \mid S_{t+1}=s'])
&& \quad \text{Markov property} \\
&= \sum_a \pi(a \mid s) \sum_{s'} \sum_{r} p(s', r \mid s, a)\,(r + \gamma\, v_{\pi}(s'))
&& \quad \text{definition of value function}
\end{alignat*}
$$

**Action-value function.**

$$
\begin{alignat*}{2}
q_{\pi}(s,a)
&= \mathbb{E}_{\pi}[G_t \mid S_t=s, A_t=a]
&& \quad \text{definition of value function} \\
&= \mathbb{E}_{\pi}[R_{t+1} + \gamma G_{t+1} \mid S_t=s, A_t=a]
&& \quad \text{recursive form of return} \\
&= \sum_{s'} \sum_r p(s', r \mid s,a)\, \mathbb{E}_{\pi}[R_{t+1} + \gamma G_{t+1} \mid S_t=s, A_t=a, S_{t+1}=s', R_{t+1}=r]
&& \quad \text{law of total expectation} \\
&= \sum_{s'} \sum_r p(s', r \mid s,a)\,(r + \gamma\, \mathbb{E}_{\pi}[G_{t+1}\mid S_{t+1}=s'])
&& \quad \text{Markov property} \\
&= \sum_{s'} \sum_r p(s', r \mid s,a)\,(r + \gamma\, v_{\pi}(s'))
&& \quad \text{definition of value function} \\
&= \sum_{s'} \sum_r p(s', r \mid s,a)\Big(r + \gamma \sum_{a'} \pi(a' \mid s')\, q_{\pi}(s',a')\Big)
&& \quad \text{expand } v_{\pi} \text{ via } q_{\pi}
\end{alignat*}
$$
