---
title: "SSD: Single Shot MultiBox Detector"
category: "Literature Review"
subcategory: "Vision · Detection & Segmentation"
excerpt: "A single-shot detector: predict class scores + box offsets over multi-scale default boxes at every feature-map location, in one forward pass."
tags:
  - ML
  - DL
  - Computer Vision
  - Object Detection
  - Paper Notes
---

Paper: [arXiv:1512.02325](https://arxiv.org/abs/1512.02325)

SSD discretises the output space into **default boxes** of various scales and aspect ratios at each feature-map location. For $m$ detection feature maps, the scale of the $k$-th is

$$
s_k = s_{\min} + \frac{s_{\max}-s_{\min}}{m-1}(k-1), \quad k\in[1,m],
$$

with $s_{\min}=0.2$, $s_{\max}=0.9$ — lower (earlier) feature maps detect small objects, higher maps detect large ones. For aspect ratios $a_r\in\{1,2,3,\tfrac12,\tfrac13\}$: $w_k = s_k\sqrt{a_r}$ and $h_k = s_k/\sqrt{a_r}$, plus an extra box of scale $\sqrt{s_k s_{k+1}}$ for $a_r=1$. Box centres sit at $\big(\tfrac{i+0.5}{|f_k|}, \tfrac{j+0.5}{|f_k|}\big)$.

**Matching.** Each ground-truth box takes its highest-IoU default box, plus any default box with IoU $\ge 0.5$; the rest become background (with hard-negative mining).

**Loss.**

$$
\mathcal{L} = \frac{1}{N}\big(\mathcal{L}_{\text{cls}} + \mathcal{L}_{\text{loc}}\big),
$$

where $N$ is the number of matched (positive) boxes, $\mathcal{L}_{\text{loc}}$ is a smooth-L1 regression on box offsets, and $\mathcal{L}_{\text{cls}}$ is a softmax over classes (object vs. background).

![SSD multi-scale detection](/images/notes/ssd-1.png)
