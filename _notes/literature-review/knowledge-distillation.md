---
title: "Knowledge Distillation: Distilling the Knowledge in a Neural Network"
category: "Literature Review"
subcategory: "Training & Compression"
excerpt: "Transfer a cumbersome teacher's knowledge to a small student by training on the teacher's temperature-softened soft targets."
tags:
  - ML
  - DL
  - Model Compression
  - Paper Notes
---

Paper: [arXiv:1503.02531](https://arxiv.org/abs/1503.02531)

## Idea

Training and deployment have different needs — training extracts knowledge from raw data (slow), while deployment must be fast and efficient. **Distillation** trains a cumbersome **teacher**, then transfers its knowledge — the input→output *function*, not the weights — to a small **student**. The teacher's small probabilities for the wrong classes ("almost certainly a 2, but maybe a 3 or a 7") carry similarity information that hard labels discard, so the student trains on **soft targets** and inherits some of the ensemble's generalisation.

## Temperature

![Distillation with a softened softmax](/images/notes/knowledge-distillation-1.png)

Softmax with temperature $T$:

$$
q_i = \frac{\exp(z_i/T)}{\sum_j \exp(z_j/T)}.
$$

$T=1$ is the normal case; $T<1$ sharpens the distribution; $T>1$ softens it, inflating the small probabilities the student should learn from. The basic procedure: (1) train the teacher; (2) produce soft targets at high $T$; (3) train the student on them at the same $T$ (optionally combined with hard-label cross-entropy); (4) deploy at $T=1$.

## Gradient

$$
\frac{\partial C}{\partial z_i} = \frac{1}{T}(q_i - p_i) \;\overset{\text{high }T}{\approx}\; \frac{1}{NT^2}(z_i - v_i),
$$

where $z_i, v_i$ are the student and teacher logits, under the zero-mean assumption $\sum_j z_j = \sum_j v_j = 0$. So at high temperature, distillation is approximately matching logits.

## Specialists

For very large datasets a full ensemble is expensive. **Specialist** models each focus on a subset of confusing classes; they overfit easily, but training on soft targets regularises them.
