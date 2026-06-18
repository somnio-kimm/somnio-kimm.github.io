---
title: "FAST: Efficient Action Tokenisation for Vision-Language-Action Models"
category: "Literature Review"
subcategory: "Robot Learning (VLA)"
excerpt: "Compressing robot action chunks with the DCT + BPE so an autoregressive VLA can treat actions like text tokens."
tags:
  - ML
  - DL
  - Robotics
  - VLA
  - Paper Notes
---

![FAST: naive per-timestep binning produces highly correlated tokens](/images/notes/fast-1.png)

In a naïve binning scheme (discretising each time step), the resulting tokens are highly correlated. An autoregressive model can then reach very low loss by simply copying the previous token — learning nothing useful.

## Decorrelation

Decorrelation transforms the data so each token carries unique, non-redundant information. FAST does this with the **Discrete Cosine Transform (DCT)**.

![FAST: DCT-based action tokenisation pipeline](/images/notes/fast-2.png)

![FAST: DCT coefficients of an action chunk](/images/notes/fast-3.png)

| Aspect | Fourier transform / DFT | Discrete cosine transform / DCT |
|---|---|---|
| Basis functions | Sines and cosines (complex exponentials) | Cosines only |
| Output | Usually complex | Usually real |
| Phase information | Explicitly represented | Not represented the same way |
| Boundary assumption | Signal repeats periodically | Signal is mirrored at the boundary |
| Common uses | Spectral analysis, filtering, physics, comms | Image / video / audio compression |
| Edge behaviour | Can create sharp boundary discontinuities | Often reduces boundary discontinuities |

The transform uses only the given finite samples but mathematically treats the signal as continuing in a particular way at the boundaries, outputting coefficients that describe how much of each basis pattern reconstructs the block.

## Byte-Pair Encoding

After DCT and quantisation, a raw sequence of integer frequency coefficients remains. **BPE** merges frequently-occurring patterns of coefficients into single new symbols (the vocabulary):

- **Reducing sequence length** — without BPE the model would predict a long sequence of individual DCT coefficients, many of them zero.
- **Fitting the LLM backbone** — modern VLAs reuse pre-trained LLMs with fixed capacity for new tokens, and a fixed-size BPE vocab slots into the existing vocabulary.

## Pros & cons

- **Pros:** faster training convergence than diffusion VLAs; efficient analytical tokenisation (DCT is a standard operation, no extra neural passes); handles high-frequency robot data by compressing it into frequency space.
- **Cons:** sequential token generation (unlike diffusion's parallel refinement, FAST decodes one token at a time); in the $\pi_0$ architecture the autoregressive FAST model uses the full 2B-parameter backbone for every token, whereas diffusion $\pi_0$ uses a smaller (~300M) action expert.

## Contribution

- Next-token prediction performed poorly on high-frequency robot data because tokens were too redundant; FAST decorrelates them, so robot actions can be treated exactly like text tokens in a standard transformer.
- Unlike diffusion VLAs (which add diffusion-decoding weights or a separate action-expert head), FAST needs no modification to the pre-trained transformer.
- Diffusion models are often faster at inference but much slower to train; autoregressive FAST is more compute-efficient and followed language instructions more reliably than the diffusion version.

## Implementation

A VLA processes a single token sequence, typically ordered

$$
[\text{Images}] \rightarrow [\text{Instruction/Prompt}] \rightarrow [\text{State}] \rightarrow [\text{Actions}]
$$

FAST compresses continuous action chunks into discrete tokens designed to be read by the LLM backbone like text, occupying the space the prompt previously held.

| | `pi0` (flow-matching) | `pi0_fast` (autoregressive) |
|---|---|---|
| Architecture | VLM backbone + 300M flow-matching action expert | VLM backbone only |
| How actions come out | ~10 denoising steps → continuous chunk (~100 ms) | decode ~30–60 FAST tokens → inverse FAST (~750 ms) |
| Training loss | flow-matching MSE on the action expert | cross-entropy on next FAST token |
| FAST tokeniser's role | training-only side channel; inference unchanged | the model's primary output |

## Next-token prediction loss

Given tokens $x_1, \dots, x_T$, the model predicts each token from those before it. With vocabulary size $V$, logits $\ell_t \in \mathbb{R}^{V}$ become probabilities via softmax:

$$
p_{t,v} = \frac{\exp(\ell_{t,v})}{\sum_{u=1}^{V} \exp(\ell_{t,u})}
$$

The target at position $t$ is the next token $y_t = x_{t+1}$, and the per-sequence loss is the average negative log-likelihood:

$$
\mathcal{L} = -\frac{1}{T-1} \sum_{t=1}^{T-1} \log p_t(x_{t+1})
$$
