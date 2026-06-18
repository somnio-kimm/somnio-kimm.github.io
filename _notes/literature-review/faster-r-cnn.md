---
title: "Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks"
category: "Literature Review"
subcategory: "Vision · Detection & Segmentation"
excerpt: "Replacing selective search with a learned Region Proposal Network that shares features with the detector."
tags:
  - ML
  - DL
  - CV
  - Object Detection
  - Paper Notes
---

Paper: [arXiv:1506.01497](https://arxiv.org/abs/1506.01497)

![Faster R-CNN: shared backbone, Region Proposal Network, and Fast R-CNN detector head](/images/notes/faster-r-cnn-1.png)

Instead of selective-search proposals, Faster R-CNN trains a **Region Proposal Network (RPN)**. The RPN slides over the backbone's feature map; at each position it places reference boxes (**anchors**) with predefined scales and aspect ratios, and predicts:

- **Objectness** (classification head): does the anchor cover an object?
- **Box offsets** (regression head): how to adjust the anchor to fit the object?

An anchor is **positive** if $IoU \geq 0.7$ with some ground-truth box (or it is the highest-IoU anchor for that box), **negative** if $IoU \leq 0.3$ with all ground-truth boxes, and ignored otherwise. Sample 256 anchors per image (128 positive, 128 negative) into a batch. The losses are a classification term $\mathcal{L}_{\mathrm{cls}}(p_i, p_i^{*})$ (with $p_i^{*} = 1$ for object, $0$ for background) and a regression term $p_i^{*}\,\mathcal{L}_{\mathrm{reg}}(t_i, t_i^{*})$ active only for positive anchors.

The RPN and the Fast R-CNN detector **share** convolutional features but each keeps its own loss. Two training schemes:

- **Joint training** — one network, shared features, end-to-end:

$$
\mathcal{L} = \mathcal{L}_{\mathrm{RPN\text{-}cls}} + \mathcal{L}_{\mathrm{RPN\text{-}reg}} + \mathcal{L}_{\mathrm{FastRCNN\text{-}cls}} + \mathcal{L}_{\mathrm{FastRCNN\text{-}reg}}
$$

- **Alternating training** — train the RPN on the shared CNN, use its proposals to train Fast R-CNN, fine-tune the RPN (now initialised from the Fast-R-CNN-tuned CNN), and optionally fine-tune Fast R-CNN again.
