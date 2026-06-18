---
title: "Reinforcement Learning"
excerpt: "MDPs and value functions, policy optimization, and imitation learning."
toc: true
toc_sticky: true
---

{% include base_path %}

Notes on reinforcement learning — from the MDP formalism through policy optimization and imitation learning.

{% assign suborder = "Foundations|Policy Optimization|Imitation Learning" | split: "|" %}
{% for sub in suborder %}
  {% assign items = site.notes | where: "category", "Reinforcement Learning" | where: "subcategory", sub | sort: "title" %}
  {% if items.size > 0 %}
<h2 id="{{ sub | slugify }}">{{ sub }}</h2>
<ul>
{% for n in items %}<li><a href="{{ base_path }}{{ n.url }}">{{ n.title }}</a>{% if n.excerpt %} — {{ n.excerpt | markdownify | strip_html | strip_newlines }}{% endif %}</li>
{% endfor %}</ul>
  {% endif %}
{% endfor %}
