---
title: "YOLO: Unified, Real-Time Object Detection"
category: "Literature Review"
subcategory: "Vision · Detection & Segmentation"
excerpt: "Single-shot detection on an S×S grid, with a three-part localisation/confidence/classification loss."
tags:
  - ML
  - DL
  - CV
  - Object Detection
  - Paper Notes
---

Paper: [arXiv:1506.02640](https://arxiv.org/abs/1506.02640)

Divide the image into an $S \times S$ grid. Each object is assigned to the cell containing its centre. Each cell predicts $B$ bounding boxes $(x, y, w, h, \text{confidence})$ and $C$ conditional class probabilities $P(\text{Class}_i \mid \text{Object})$. Among the $B$ boxes in a cell, the one with higher IoU to the ground truth is responsible for that object.

![YOLO: S×S grid with per-cell box and class predictions](/images/notes/yolo-1.png)

The loss has three components.

**Localisation** — push the responsible box's $x, y$ offsets and $w, h$ toward the target (square roots so errors on large and small boxes count comparably):

$$
\mathcal{L}_{\mathrm{loc}} = \lambda_{\mathrm{coord}} \sum_{i, j} \mathbb{1}_{i,j}^{\mathrm{obj}} \big[(x_i - \hat{x}_i)^2 + (y_i - \hat{y}_i)^2\big] + \lambda_{\mathrm{coord}} \sum_{i, j} \mathbb{1}_{i,j}^{\mathrm{obj}} \big[(\sqrt{w_i} - \sqrt{\hat{w}_i})^2 + (\sqrt{h_i} - \sqrt{\hat{h}_i})^2\big]
$$

**Confidence** — predict the score $P(\text{obj}) \times \mathrm{IoU}_{\mathrm{pred}}^{\mathrm{truth}}$, down-weighting cells with no object via $\lambda_{\mathrm{noobj}}$:

$$
\mathcal{L}_{\mathrm{conf}} = \sum_{i, j} \mathbb{1}_{i,j}^{\mathrm{obj}} (C_i - \hat{C}_i)^2 + \lambda_{\mathrm{noobj}} \sum_{i, j} \mathbb{1}_{i,j}^{\mathrm{noobj}} (C_i - \hat{C}_i)^2
$$

**Classification** — for cells containing an object, push the class probabilities toward the one-hot target:

$$
\mathcal{L}_{\mathrm{cls}} = \sum_{i} \mathbb{1}_{i}^{\mathrm{obj}} \sum_{c \in \mathrm{classes}} (p_i(c) - \hat{p}_i(c))^2
$$

The class-specific confidence at test time is $P(\text{obj}) \times \mathrm{IoU}_{\mathrm{pred}}^{\mathrm{truth}} \times P(\text{Class}_i \mid \text{Object}) = P(\text{Class}_i) \times \mathrm{IoU}_{\mathrm{pred}}^{\mathrm{truth}}$.
