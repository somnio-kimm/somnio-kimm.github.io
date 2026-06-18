---
title: "Probability of a Trajectory"
category: "Reinforcement Learning"
subcategory: "Foundations"
excerpt: "Factorising the trajectory distribution with the chain rule, and why its score function drops the environment terms."
tags:
  - ML
  - RL
---

Let the trajectory be

$$
\tau = (s_{1}, a_{1}, s_{2}, a_{2}, \dots, s_{T}, a_{T}, s_{T+1})
$$

By the chain rule, the full joint probability is

$$
\begin{align*}
p_{\theta}(\tau) &= p_{\theta}(s_{1}, a_{1}, s_{2}, a_{2}, \dots, s_{T}, a_{T}, s_{T+1}) \\
&= p(s_{1})\, p_{\theta}(a_{1} \mid s_{1})\, p(s_{2} \mid s_{1}, a_{1})\, p_{\theta}(a_{2} \mid s_{1}, a_{1}, s_{2}) \cdots
\end{align*}
$$

The environment does not depend on the policy parameters, but the agent's policy comes from the policy network being learned. RL uses two assumptions:

- The policy is Markov:

$$
p_{\theta}(a_{t} \mid s_{1}, a_{1}, \dots, s_{t}) = \pi_{\theta}(a_{t} \mid s_{t})
$$

- The environment is an MDP:

$$
p(s_{t+1} \mid s_{1}, a_{1}, \dots, s_{t}, a_{t}) = p(s_{t+1} \mid s_{t}, a_{t})
$$

Substituting into the chain-rule expansion,

$$
p_{\theta}(\tau) = p(s_{1}) \prod_{t=1}^{T} \pi_{\theta}(a_{t} \mid s_{t})\, p(s_{t+1} \mid s_{t}, a_{t})
$$

Taking the log,

$$
\log p_{\theta}(\tau) = \log p(s_{1}) + \sum_{t=1}^{T} \log \pi_{\theta}(a_{t} \mid s_{t}) + \sum_{t=1}^{T} \log p(s_{t+1} \mid s_{t}, a_{t})
$$

Differentiating with respect to $\theta$ — the environment terms vanish, since they do not depend on $\theta$:

$$
\nabla_{\theta} \log p_{\theta}(\tau) = \sum_{t=1}^{T} \nabla_{\theta} \log \pi_{\theta}(a_{t} \mid s_{t})
$$
