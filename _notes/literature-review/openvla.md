---
title: "OpenVLA: An Open-Source Vision-Language-Action Model"
category: "Literature Review"
subcategory: "Robot Learning (VLA)"
excerpt: "A 7B VLA: DINOv2 + SigLIP vision into a LLaMA-2 backbone, with robot actions discretised into 256 bins reusing the last tokeniser slots."
tags:
  - ML
  - DL
  - Robotics
  - VLA
  - Paper Notes
---

Paper: [arXiv:2406.09246](https://arxiv.org/abs/2406.09246)

## The OpenVLA model

![OpenVLA: DINOv2 + SigLIP vision → MLP projector → LLaMA-2, action tokens decoded autoregressively](/images/notes/openvla-1.png)

Three input types — vision, language, action:

- **Vision.** The image goes through **DINOv2** (object geometry, spatial relations) and **SigLIP** (word–region semantics); outputs are pooled, fused, and passed through an MLP projector to LLaMA's dimension $d = 4096$, giving vision tokens $V = [v_1, \dots, v_{N_v}]$, $v_i \in \mathbb{R}^{4096}$.
- **Language.** The instruction is tokenised by the LLaMA tokeniser and embedded, giving $L = [l_1, \dots, l_{N_l}]$, $l_i \in \mathbb{R}^{4096}$.
- **Action.** Each 7-DoF action $a_t = [\Delta x, \Delta y, \Delta z, \Delta\text{roll}, \Delta\text{pitch}, \Delta\text{yaw}, \text{grip}]$ has each dimension binned into 256 uniform bins. The **last 256 tokens** of the LLaMA-2 vocabulary ($V = 32000$, $d = 4096$) are overwritten with symbolic action tokens:

```text
0     -> <bos>
1     -> <eos>
...
31744 -> "action_x_0"
...
31999 -> "action_x_255"
```

The three are concatenated into $X = [V; L; A]$ and fed to the LLaMA-2 transformer. The final hidden state $h_t$ is projected to logits $y_{\text{logits}} = W_{out}\,h_t$ (over word + action tokens), and **cross-entropy is applied only to the action tokens**. At inference there is no proprioceptive input — only vision and language — and the model autoregressively predicts action tokens one at a time.
