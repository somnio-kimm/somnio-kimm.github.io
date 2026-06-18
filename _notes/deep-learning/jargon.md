---
title: "Jargon"
category: "Deep Learning"
subcategory: "Glossary"
excerpt: "A running glossary of ML / generative-modelling / RL terms, from ELBO and KL divergence to confounders and KV caches."
tags:
  - ML
  - DL
  - Glossary
---

**Generative model.**

- *Explicit density* — model $p(x)$ explicitly.
  - *Tractable likelihood:* autoregressive models factorise $p(x) = \prod_{i=1}^{d} p(x_i \mid x_{<i})$; normalising flows learn an invertible $f_\theta(z)$ from noise to data with an exact change-of-variable likelihood.
  - *Approximate likelihood:* the VAE introduces latents $z$ and optimises the ELBO (with the reparameterisation trick).
- *Implicit density* — generate samples without modelling density: GANs (generator $G(z)$ + discriminator $D(x)$); energy-based models $p(x) \propto \exp(-E(x))$ sampled by MCMC.
- *Score-based & diffusion* — diffusion (forward noising, learned reverse denoising); score-based models learn $\nabla_x \log p_t(x)$ and sample via SDEs.

**Evidence Lower Bound (ELBO).** With latent $z$, the marginal $p(x) = \int p(x,z)\,dz$ is intractable, so introduce an approximate posterior $q_\phi(z \mid x)$:

$$
\begin{aligned}
\log p(x) &= \mathbb{E}_{q_\phi(z\mid x)}\!\left[\log \frac{p(x,z)}{q_\phi(z\mid x)}\right] + D_{\mathrm{KL}}\!\big(q_\phi(z\mid x)\,\|\,p(z\mid x)\big) \\
&\geq \mathbb{E}_{q_\phi(z\mid x)}\!\left[\log \frac{p(x,z)}{q_\phi(z\mid x)}\right]
\end{aligned}
$$

Maximising the ELBO minimises the KL to the true posterior.

**Jensen's inequality.** For convex $f$, $f(\mathbb{E}[X]) \leq \mathbb{E}[f(X)]$ (reversed for concave). Since $\log$ is concave, $\mathbb{E}[\log Z] \leq \log \mathbb{E}[Z]$.

**Entropy.** $H(p) = -\sum_x p(x) \log p(x)$ — uncertainty of $p$.

**Cross-entropy.** $H(p, q) = -\sum_x p(x) \log q(x)$ — difference between a true $p$ and an estimate $q$.

**KL divergence.** $D_{\mathrm{KL}}(p \,\|\, q) = \sum_x p(x) \log \frac{p(x)}{q(x)} = H(p, q) - H(p)$ — the extra cost of encoding $p$ using $q$.

**Maximum likelihood (MLE).** $\hat{\theta}_{\mathrm{MLE}} = \arg\max_\theta P(X \mid \theta)$ — equivalent to minimising cross-entropy between the empirical and model distributions.

**Maximum a posteriori (MAP).** Like MLE but with a prior: $\hat{\theta}_{\mathrm{MAP}} = \arg\max_\theta P(X \mid \theta) P(\theta)$.

**Monte-Carlo estimate.** Approximate an intractable expectation by sampling: $\mathbb{E}_{q(x)}[p(x)] \approx \frac{1}{L} \sum_{l=1}^{L} p(x^{(l)})$ with $x^{(l)} \sim q(x)$.

**Imitation learning vs. reinforcement learning.**

- *Imitation learning* — fit $\pi_\theta(a \mid s)$ to match expert actions; fast to train but suffers compounding errors. Variants: behavioural cloning (supervised), inverse RL (infer the reward, then RL), GAIL (make generated trajectories indistinguishable from expert ones).
- *Reinforcement learning* — learn $\pi_\theta(a \mid s)$ by trial-and-error to maximise expected cumulative reward; can exceed human strategies but reward design is tricky. Families: value-based, policy-based, actor–critic.

**Policy.** A mapping from observation to action, $\pi(a \mid o)$. *Explicit* policies predict the best action directly; *implicit* policies predict an energy score and sample by minimising it.

**Langevin dynamics.** A particle feels a deterministic force plus thermal noise: $dx_t = -\nabla E(x_t)\,dt + \sqrt{2\beta^{-1}}\,dW_t$. The Euler-discretised form is $x_{k+1} = x_k + \eta \nabla_x \log p(x_k) + \sqrt{2\eta}\,\xi_k$ with $\xi_k \sim \mathcal{N}(0, I)$. Without the noise it converges to a mode (like MAP); with it, the stationary distribution equals $p(x)$, giving diverse samples.

**Energy function.** At thermal equilibrium, $p(x) = \frac{1}{Z}\exp(-\beta E(x))$ with partition function $Z$; high probability ↔ low energy.

**Horizon.** *Temporal* (how many future steps a decision considers — short = reactive, long = planning), *training* (length of sampled trajectories), and *effective* (how far ahead predictions meaningfully influence learning).

**Action sequences.** *Open-loop* — a fixed sequence executed without feedback (vulnerable to error accumulation). *Closed-loop* — each action depends on the current observation.

**Multimodal distribution.** A distribution with multiple modes (local density peaks).

**Exponential moving average (EMA).** Smoothing that weights recent observations more heavily than older ones.

**Time embedding.** In diffusion, the network must know which denoising step $t$ it is on, since the amount of noise to remove depends on $t$.

**Reparameterisation trick.** Sampling blocks backprop; instead of $z \sim \mathcal{N}(\mu, \sigma)$, write $z = \mu + \epsilon\sigma$ with $\epsilon \sim \mathcal{N}(0, 1)$, separating the deterministic and random parts.

**Self- vs. cross-attention.** Self-attention: $Q, K, V$ from the same sequence. Cross-attention: $Q$ from one sequence, $K, V$ from another.

**End-to-end vs. modular learning.** End-to-end: raw inputs → outputs in one optimisation (image → actions). Modular: distinct stages (perception → planning → control).

**Confounder.** A variable correlated with both input and output that creates spurious correlations (e.g. carrying a lighter correlates with lung cancer because both correlate with smoking).

**Conditional vs. marginal.** Conditional = per data point; marginal = across the distribution of data points.

**Representation learning vs. task learning.** Representation learning encodes data into a useful vector space for downstream tasks; task learning directly performs tasks (often via context) and generalises without fine-tuning.

**Linear probe.** A simple linear classifier trained on top of *frozen* features from a pre-trained model.

**Covariate shift.** *External:* $p_{\text{test}}(x, y) \neq p_{\text{train}}(x, y)$. *Internal:* each layer must adapt to shifting input distributions from earlier layers (BatchNorm mitigates this).

**IoU.** $\mathrm{IoU} = \dfrac{\text{intersection area}}{\text{union area}}$.

**Mean average precision (mAP).** A detection metric.

![Precision–recall curve underlying average precision](/images/notes/jargon-1.png)

With $\text{Precision} = \frac{TP}{TP + FP}$ and $\text{Recall} = \frac{TP}{TP + FN}$, sweep the confidence threshold to trace a precision–recall curve; AP is its area, and mAP averages AP across classes.

**Object detection.** *One-stage:* a single network makes a fixed set of predictions directly. *Two-stage:* propose candidate regions, then classify and refine them.

**Online vs. offline.** Online: the full input history is available, then summarised after the fact. Offline: at each time $t$, update the summary using only inputs up to $t$.

**Positional encoding.** *Absolute:* fixed vectors added to token embeddings to encode position. *Relative:* encode the distance between token pairs.

**Context.** A token's representation in light of surrounding tokens — *left context* (tokens before) and *right context* (tokens after).

**Late fusion.** Independent unimodal processing (separate vision and language encoders) with the embeddings fused at the end.

**Causal vs. bidirectional attention.** *Causal:* a token attends only to itself and earlier tokens, $M_{ij} = 0$ if $j \le i$ and $-\infty$ if $j > i$ — enforcing forward temporal order. *Bidirectional:* every token attends to all others ($M_{ij} = 0$ for all $i, j$).
