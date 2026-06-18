---
title: "Policy Improvement Theorem"
category: "Reinforcement Learning"
subcategory: "Foundations"
excerpt: "If a new policy is greedy with respect to the old policy's action values, it is at least as good — proved by unrolling the Bellman inequality."
tags:
  - ML
  - RL
---

If a new policy $\pi'$ chooses actions that are at least as good under the old policy-value estimate $q_{\pi}$, then $\pi'$ is at least as good as $\pi$.

$$
\begin{alignat*}{2}
v_\pi(s)
&= q_{\pi}(s, \pi(s))
&& \quad \text{definition of value function} \\
&\leq q_\pi(s, \pi'(s))
&& \quad \text{policy-improvement assumption } q_\pi(s,\pi(s)) \le q_\pi(s,\pi'(s)) \\
&= \mathbb{E}_{\pi'}[R_{t+1}+\gamma G_{t+1} \mid S_t=s,\ A_t=\pi'(s)]
&& \quad \text{Bellman equation for } q_\pi \\
&= \mathbb{E}_{\pi'}[R_{t+1} + \gamma G_{t+1} \mid S_t=s]
&& \quad \text{under } \pi',\ A_t=\pi'(s) \\
&= \mathbb{E}_{\pi'}[R_{t+1} \mid S_t=s] + \gamma\, \mathbb{E}_{\pi'}[G_{t+1} \mid S_t=s]
&& \quad \text{linearity} \\
&= \mathbb{E}_{\pi'}[R_{t+1} \mid S_t=s] + \gamma\, \mathbb{E}_{\pi'}\!\big[\mathbb{E}_{\pi'}[G_{t+1} \mid S_{t+1}] \mid S_t=s\big]
&& \quad \text{tower rule + Markov} \\
&= \mathbb{E}_{\pi'}[R_{t+1} \mid S_t=s] + \gamma\, \mathbb{E}_{\pi'}[v_{\pi'}(S_{t+1}) \mid S_t=s]
&& \quad \text{definition of value function} \\
&= \mathbb{E}_{\pi'}[R_{t+1} + \gamma v_{\pi'}(S_{t+1}) \mid S_t=s]
&& \quad \text{linearity} \\
&\leq \mathbb{E}_{\pi'}[R_{t+1} + \gamma q_\pi(S_{t+1}, \pi'(S_{t+1})) \mid S_t=s]
&& \quad \text{policy-improvement assumption} \\
&= \mathbb{E}_{\pi'}[R_{t+1} + \gamma R_{t+2} + \gamma^2 v_\pi(S_{t+2}) \mid S_t=s]
&& \quad \text{expand once more} \\
&\leq \mathbb{E}_{\pi'}[R_{t+1} + \gamma R_{t+2} + \gamma^2 q_\pi(S_{t+2}, \pi'(S_{t+2})) \mid S_t=s]
&& \\
&\leq \cdots && \\
&\leq \mathbb{E}_{\pi'}[R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots \mid S_t=s]
&& \quad \gamma^n v_\pi(S_{t+n}) \to 0 \\
&= \mathbb{E}_{\pi'}[R_{t+1} + \gamma G_{t+1} \mid S_t=s]
&& \quad \text{definition of return} \\
&= v_{\pi'}(s)
&& \quad \text{definition of value function}
\end{alignat*}
$$
