---
title: "Surrogate Objective"
category: "Reinforcement Learning"
subcategory: "Policy Optimization"
excerpt: "A stand-in scalar objective whose gradient reproduces the true (hard-to-optimise) RL gradient."
tags:
  - ML
  - RL
---

A surrogate objective is a stand-in loss that is optimised even though it is not the true RL objective, because its gradient gives the optimal update.

Often the gradient formula $\nabla_{\theta} J(\theta)$ is derived first, but the objective itself is hard to optimise directly. Instead, one builds a scalar function $\tilde{J}(\theta)$ whose gradient reproduces that formula — the surrogate objective.
