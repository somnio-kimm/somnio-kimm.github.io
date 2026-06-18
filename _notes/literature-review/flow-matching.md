---
title: "Flow Matching for Generative Modeling"
category: "Literature Review"
subcategory: "Generative Models"
excerpt: "Learn a vector field that transports noise to data by regressing it against analytically-constructed conditional vector fields (conditional flow matching)."
tags:
  - ML
  - DL
  - Generative Models
  - Flow Matching
  - Paper Notes
---

## Objective

Diffusion adds noise then denoises step by step. Flow matching generalises this. Let $p_0 = \mathcal{N}(0,I)$ and $p_1$ be the data distribution; the aim is to morph $p_0 \to p_1$ **directly**, without explicitly defining the intermediate steps. Since $p_1$ is unknown (only finitely many samples), approximate it with $q$ — a mixture of Gaussians centred at the sample points — and model the morphism $p_0 \to q$.

## Flow, vector field, probability path

- **Probability density path** $p : [0,1]\times\mathbb{R}^d \to \mathbb{R}_{>0}$.
- **Time-dependent vector field** $v : [0,1]\times\mathbb{R}^d \to \mathbb{R}^d$.
- **Flow** $\phi : [0,1]\times\mathbb{R}^d \to \mathbb{R}^d$, defined by the ODE $\frac{d}{dt}\phi_t(x) = v_t(\phi_t(x))$, $\phi_0(x)=x$ — every point moves along the vector field.

$v_t$ *generates* $p_t$ if its flow satisfies the push-forward $p_t = [\phi_t]_* p_0 = p_0(\phi_t^{-1}(x))\,\det\!\big[\tfrac{\partial \phi_t^{-1}}{\partial x}(x)\big]$. The goal is to learn the parametric field $v_t(x;\theta)$.

## Flow matching → conditional flow matching

The flow-matching objective regresses the learned field against the target field $u_t$:

$$
\mathcal{L}_{\text{FM}}(\theta) = \mathbb{E}_{t,\,p_t(x)}\,\|v_t(x) - u_t(x)\|^2, \quad t\sim\mathcal{U}(0,1),\ x\sim p_t(x).
$$

But the marginal path and field are intractable:

$$
p_t(x) = \int p_t(x\mid x_1)\,q(x_1)\,dx_1, \qquad u_t(x) = \int u_t(x\mid x_1)\,\frac{p_t(x\mid x_1)\,q(x_1)}{p_t(x)}\,dx_1.
$$

So define them **per-sample** via the **conditional flow matching** objective:

$$
\mathcal{L}_{\text{CFM}}(\theta) = \mathbb{E}_{t,\,q(x_1),\,p_t(x\mid x_1)}\,\|v_t(x) - u_t(x\mid x_1)\|^2.
$$

Crucially $\nabla_\theta \mathcal{L}_{\text{FM}} = \nabla_\theta \mathcal{L}_{\text{CFM}}$ — the two give identical gradients — but CFM is tractable because $p_t(\cdot\mid x_1)$ and $u_t(\cdot\mid x_1)$ are simple.

## Gaussian conditional paths

Choose $p_t(x\mid x_1)=\mathcal{N}\big(x \mid \mu_t(x_1),\,\sigma_t(x_1)^2 I\big)$ with $\mu_0=0,\sigma_0=1$ (every path starts at $\mathcal{N}(0,I)$) and $\mu_1=x_1,\sigma_1=\sigma_{\min}$. Among the infinitely many fields generating a given path, take the flow $\psi_t(x)=\sigma_t(x_1)x + \mu_t(x_1)$, which pushes $p_0 \to p_t(\cdot\mid x_1)$ and yields the closed-form target field

$$
u_t(x\mid x_1) = \frac{\sigma_t'(x_1)}{\sigma_t(x_1)}\big(x - \mu_t(x_1)\big) + \mu_t'(x_1), \qquad f' \equiv \tfrac{d}{dt}f.
$$

## Implementation

Training samples a random time $t\in[0,1]$ along the noise↔data path. A transformer can't consume a raw scalar $t$, so embed it into a high-dimensional **time embedding** that encodes where along the path the sample sits.

## References

- [arXiv:2210.02747 — Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747)
- [arXiv:2412.06264 — Flow Matching Guide and Code](https://arxiv.org/abs/2412.06264)
- [Lilian Weng — Flow-based Deep Generative Models](https://lilianweng.github.io/posts/2018-10-13-flow-models/)
- Videos: [Yannic Kilcher](https://www.youtube.com/watch?v=7NNxK3CqaDk), [Outlier](https://www.youtube.com/watch?v=7cMzfkWFWhI)
