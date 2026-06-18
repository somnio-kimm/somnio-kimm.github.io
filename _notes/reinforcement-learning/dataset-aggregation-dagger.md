---
title: "Dataset Aggregation (DAgger)"
category: "Reinforcement Learning"
subcategory: "Imitation Learning"
excerpt: "Fixing behaviour cloning's distribution shift by iteratively aggregating expert-labelled data on the states the learner actually visits."
tags:
  - ML
  - RL
---

In imitation learning, $p_{\text{expert}}(s) \neq p_{\pi}(s)$: once the learned policy makes a mistake, it visits states the expert dataset never covered. DAgger fixes this by iteratively growing the training set with corrective data:

1. Train a policy $\pi_{1}$ by supervised learning on an initial set of expert demonstrations $\mathcal{D}$.
2. Run the current policy $\pi_{i}$ in the environment to generate new trajectories, exposing the agent to the states it actually encounters.
3. Query an expert for the correct actions at those newly visited states.
4. Add these new state–action pairs to the dataset:

$$
\mathcal{D} \gets \mathcal{D} \cup \{ (s', a^{*}) \}
$$

5. Train a new policy $\pi_{i+1}$ on the expanded, aggregated dataset.
6. Repeat.
