---
title: "Score-Based Generative Modeling through Stochastic Differential Equations"
category: "Literature Review"
subcategory: "Generative Models"
excerpt: "Frames diffusion as a forward SDE that noises data and a reverse-time SDE that generates it by following the score ∇ₓ log pₜ(x)."
tags:
  - ML
  - DL
  - Generative Models
  - Diffusion
  - Paper Notes
---

A diffusion process is a forward **SDE** that gradually turns data into noise:

$$
dx = f(x,t)\,dt + g(t)\,dw,
$$

where $w$ is a Wiener process (Brownian motion), $f(x,t)$ is the drift term, and $g(t)$ the diffusion coefficient. The **reverse** of a diffusion process is itself a diffusion, running backward in time:

$$
dx = \big[\,f(x,t) - g(t)^2\,\nabla_x \log p_t(x)\,\big]\,dt + g(t)\,d\bar{w}.
$$

Generation therefore reduces to estimating the **score** $\nabla_x \log p_t(x)$ with a learned network; plugging it into the reverse SDE and integrating from noise back to data produces samples. DDPM and score matching with Langevin dynamics are both discretisations of this common SDE framework.

## References

- [arXiv:2011.13456](https://arxiv.org/abs/2011.13456)
- [Vincent — A Connection Between Score Matching and Denoising Autoencoders](https://www.iro.umontreal.ca/~vincentp/Publications/smdae_techreport.pdf)
- [Video](https://www.youtube.com/watch?v=lUljxdkolK8)
