---
title: "Deep Learning"
excerpt: "Architectures and the mechanisms behind them."
toc: true
toc_sticky: true
---

{% include base_path %}

Notes on deep-learning architectures and the mechanisms behind them.

{% assign suborder = "Transformers & Attention|Glossary" | split: "|" %}
{% for sub in suborder %}
  {% assign items = site.notes | where: "category", "Deep Learning" | where: "subcategory", sub | sort: "title" %}
  {% if items.size > 0 %}
<h2 id="{{ sub | slugify }}">{{ sub }}</h2>
<ul>
{% for n in items %}<li><a href="{{ base_path }}{{ n.url }}">{{ n.title }}</a>{% if n.excerpt %} — {{ n.excerpt | markdownify | strip_html | strip_newlines }}{% endif %}</li>
{% endfor %}</ul>
  {% endif %}
{% endfor %}
