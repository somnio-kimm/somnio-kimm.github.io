---
title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding"
category: "Literature Review"
subcategory: "Language"
excerpt: "Paper notes on BERT — a bidirectional transformer encoder pretrained with masked language modelling and next-sentence prediction."
tags:
  - ML
  - DL
  - NLP
  - Transformer
  - Paper Notes
---

Paper: [arXiv:1810.04805](https://arxiv.org/abs/1810.04805)

## Architecture

![BERT architecture: bidirectional transformer encoder](/images/notes/bert-1.png)

BERT is a transformer encoder that uses bidirectional self-attention. A special token `[CLS]` is prepended for classification, and `[SEP]` separates two sentences.

## Pre-training

**Masked Language Model (MLM)** — predict randomly masked tokens using both left and right context.

![BERT masked language modelling](/images/notes/bert-2.png)

- Randomly mask 15% of the tokens:
  - 80% replaced with `[MASK]`
  - 10% replaced with a random word
  - 10% left unchanged

**Next Sentence Prediction (NSP)** — model sentence-pair relationships for tasks like QA and NLI.

![BERT next-sentence prediction](/images/notes/bert-3.png)

- Binary classification:
  - 50% of the time sentence B follows sentence A (IsNext)
  - 50% of the time B is random (NotNext)
