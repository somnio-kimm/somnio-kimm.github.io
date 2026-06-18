---
title: "Mathematics"
excerpt: "Foundations — linear algebra and optimisation."
toc: true
toc_sticky: true
---

{% include base_path %}

Mathematical foundations underpinning the rest of the notes.

{% assign suborder = "Linear Algebra|Optimisation" | split: "|" %}
{% for sub in suborder %}
  {% assign items = site.notes | where: "category", "Mathematics" | where: "subcategory", sub | sort: "title" %}
  {% if items.size > 0 %}
<h2 id="{{ sub | slugify }}">{{ sub }}</h2>
<ul>
{% for n in items %}<li><a href="{{ base_path }}{{ n.url }}">{{ n.title }}</a>{% if n.excerpt %} — {{ n.excerpt | markdownify | strip_html | strip_newlines }}{% endif %}</li>
{% endfor %}</ul>
  {% endif %}
{% endfor %}
