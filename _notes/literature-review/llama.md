---
title: "LLaMA: Open and Efficient Foundation Language Models"
category: "Literature Review"
subcategory: "Language"
excerpt: "Open foundation LLMs — a decoder-only Transformer with RMSNorm pre-normalisation, SwiGLU, and rotary positional embeddings."
tags:
  - ML
  - DL
  - NLP
  - LLM
  - Paper Notes
---

Paper: [arXiv:2302.13971](https://arxiv.org/abs/2302.13971)

## Architecture

![LLaMA architecture](/images/notes/llama-1.png)

LLaMA is a decoder-only Transformer that refines the GPT-style architecture with three now-standard changes:

- **Pre-normalisation with RMSNorm** — normalise the *input* of each sub-layer (rather than the output), using RMSNorm, for training stability.
- **SwiGLU activation** — replace the ReLU feed-forward with a gated SwiGLU MLP.
- **Rotary positional embeddings (RoPE)** — encode relative position by rotating queries and keys, instead of adding absolute positional encodings.
