---
title: "Behaviour Cloning"
category: "Reinforcement Learning"
subcategory: "Imitation Learning"
excerpt: "Imitation learning by supervised regression on expert demonstrations — deterministic vs. stochastic, and the multimodality pitfall."
tags:
  - ML
  - RL
---

**Deterministic behaviour cloning.** Given demonstrations $\mathcal{D} = \{ (s, a) \}$, a deterministic policy is trained with supervised regression:

$$
\min_{\theta} \sum_{(s, a) \in \mathcal{D}} \| \pi_{\theta}(s) - a \|^{2}
$$

This works when the expert action is single-valued at each state. It struggles when multiple expert actions are reasonable, because the squared loss pushes the prediction toward the *mean* action, which may be bad or even nonsensical.

**Stochastic behaviour cloning.** Instead of predicting one action, learn a full conditional distribution:

$$
\min_{\theta} \; -\mathbb{E}_{(s, a) \sim \mathcal{D}}[\log \pi_{\theta}(a \mid s)]
$$
