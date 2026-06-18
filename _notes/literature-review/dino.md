---
title: "DINO: Emerging Properties in Self-Supervised Vision Transformers"
category: "Literature Review"
subcategory: "Vision · Transformers"
excerpt: "Self-supervised knowledge distillation with a momentum (EMA) teacher, avoiding collapse via sharpening and centring."
tags:
  - ML
  - DL
  - CV
  - Self-Supervised
  - Paper Notes
---

Paper: [arXiv:2104.14294](https://arxiv.org/abs/2104.14294)

## Objective

![DINO: student and momentum teacher with sharpening, centring, and stop-gradient](/images/notes/dino-1.png)

An image is fed into a backbone (ViT or ResNet) with a `[CLS]` token, then a 3-layer MLP projection head with normalisation, and finally a temperature-scaled softmax. DINO uses **self-supervised knowledge distillation**: unlike classical distillation where the teacher is pre-trained, here the teacher is built dynamically as an **exponential moving average (EMA)** of the student. Collapse (all embeddings becoming identical) is avoided through **sharpening** and **centring**.

The student is updated by gradient descent and sees both global and local crops; the teacher sees only global crops and is updated by EMA of the student's parameters:

$$
\theta_{\mathrm{teacher}} \gets \lambda\,\theta_{\mathrm{teacher}} + (1 - \lambda)\,\theta_{\mathrm{student}}, \qquad \lambda \in [0, 1)
$$

The teacher provides a stable target, and EMA smoothing prevents noisy updates. The student's prediction for any view should match the teacher's prediction on global views, forcing invariance across scales and augmentations. Given two global views $x_1^{g}, x_2^{g}$ and several smaller local views $V$, the objective is

$$
\min_{\theta} \sum_{x \in \{x_1^{g}, x_2^{g}\}} \sum_{\substack{x' \in V \\ x' \neq x}} H\big(P_t(x), P_s(x')\big)
$$

a cross-entropy between teacher probabilities $P_t$ and student probabilities $P_s$.

**Sharpening** makes the teacher's distribution more peaked, via a small temperature $\tau_t$ in its softmax:

$$
P_t(z)^{(i)} = \frac{\exp(z_i / \tau_t)}{\sum_j \exp(z_j / \tau_t)}
$$

A small $\tau_t$ gives a sharper (near one-hot) distribution; a large one gives a smoother, more uniform distribution. Without sharpening the teacher outputs are too flat, and the student learns only trivial uniform predictions.

**Centring** keeps the teacher from collapsing to a trivial one-hot output. An EMA of the teacher outputs is subtracted (before softmax):

$$
c \gets m\,c + (1 - m)\,\frac{1}{B}\sum_{i=1}^{B} g_{\theta_t}(x_i)
$$

so the teacher's probabilities are centred across the dataset, distributing mass over all prototypes.

Finally, **stop-gradient** is applied on the teacher branch: since the teacher is an EMA of the student, letting gradients flow into it would update it twice (once by EMA, once by gradient descent), breaking the EMA stability trick.
