---
title: "Literature Review"
excerpt: "Summaries and notes on the papers I read."
toc: true
toc_sticky: true
---

{% include base_path %}

Summaries and notes on the papers I read, grouped by area.

{% assign suborder = "Vision · Backbones|Vision · Detection & Segmentation|Vision · Transformers|Language|Multimodal|Efficient Sequence|Robot Learning (VLA)" | split: "|" %}
{% for sub in suborder %}
  {% assign items = site.notes | where: "category", "Literature Review" | where: "subcategory", sub | sort: "title" %}
  {% if items.size > 0 %}
<h2 id="{{ sub | slugify }}">{{ sub }}</h2>
<ul>
{% for n in items %}<li><a href="{{ base_path }}{{ n.url }}">{{ n.title }}</a>{% if n.excerpt %} — {{ n.excerpt | markdownify | strip_html | strip_newlines }}{% endif %}</li>
{% endfor %}</ul>
  {% endif %}
{% endfor %}
