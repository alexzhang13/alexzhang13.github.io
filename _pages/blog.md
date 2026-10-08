---
layout: default
permalink: /blog/
title: blog
description: high-quality and concise technical posts
nav: true
nav_order: 1
pagination:
  enabled: true
  collection: posts
  permalink: /page/:num/
  per_page: 5
  sort_field: date
  sort_reverse: true
  trail:
    before: 1 # The number of links before the current page
    after: 3 # The number of links after the current page
---

<div class="post kitchen">

{% assign blog_name_size = site.blog_name | size %}
{% assign blog_description_size = site.blog_description | size %}
{% assign kitchen_title = site.blog_name | replace: "🍜", "" | strip %}
{% assign newest_post = site.posts.first %}
{% assign oldest_post = site.posts.last %}

{% if blog_name_size > 0 or blog_description_size > 0 %}
  <header class="kitchen-masthead">
    <div class="kitchen-masthead-top">
      <p class="kitchen-kicker">working notes</p>
      {% if site.posts.size > 0 %}
        <p class="kitchen-count">{{ site.posts.size }} essays · {{ oldest_post.date | date: "%Y" }}–{{ newest_post.date | date: "%Y" }}</p>
      {% endif %}
    </div>
    <h1>{{ kitchen_title }} <span class="kitchen-mark" aria-hidden="true">🍜</span></h1>
    <div class="kitchen-rule" aria-hidden="true"></div>
    {% if blog_description_size > 0 %}
      <p class="kitchen-blurb">{{ site.blog_description }}</p>
    {% endif %}
  </header>
{% endif %}

<!-- {% if site.display_tags or site.display_categories %}

  <div class="tag-category-list">
    <ul class="p-0 m-0">
      {% for tag in site.display_tags %}
        <li>
          <i class="fa-solid fa-hashtag fa-sm"></i> <a href="{{ tag | slugify | prepend: '/blog/tag/' | relative_url }}">{{ tag }}</a>
        </li>
        {% unless forloop.last %}
          <p>&bull;</p>
        {% endunless %}
      {% endfor %}
      {% if site.display_categories.size > 0 and site.display_tags.size > 0 %}
        <p>&bull;</p>
      {% endif %}
      {% for category in site.display_categories %}
        <li>
          <i class="fa-solid fa-tag fa-sm"></i> <a href="{{ category | slugify | prepend: '/blog/category/' | relative_url }}">{{ category }}</a>
        </li>
        {% unless forloop.last %}
          <p>&bull;</p>
        {% endunless %}
      {% endfor %}
    </ul>
  </div>
  {% endif %} -->

{% if page.pagination.enabled %}
  {% assign postlist = paginator.posts %}
{% else %}
  {% assign postlist = site.posts %}
{% endif %}

{% assign on_first_page = true %}
{% if paginator.page and paginator.page > 1 %}
  {% assign on_first_page = false %}
  <p class="kitchen-page-note">older notes</p>
{% endif %}

<ul class="kitchen-plates">
  {% for post in postlist %}
    {% if post.external_source == blank %}
      {% assign read_time = post.content | number_of_words | divided_by: 180 | plus: 1 %}
    {% else %}
      {% assign read_time = post.feed_content | strip_html | number_of_words | divided_by: 180 | plus: 1 %}
    {% endif %}
    {% assign teaser = post.preview | default: post.description %}
    {% if on_first_page %}
      {% assign figure = post.preview_image | default: post.thumbnail %}
    {% else %}
      {% assign figure = nil %}
    {% endif %}

    {% if post.redirect == blank %}
      {% assign post_href = post.url | relative_url %}
    {% elsif post.redirect contains "://" %}
      {% assign post_href = post.redirect %}
    {% else %}
      {% assign post_href = post.redirect | relative_url %}
    {% endif %}

    <li class="plate{% if figure %} plate-has-figure{% else %} plate-text{% endif %}">
      <a
        class="plate-hit"
        href="{{ post_href }}"
        {% if post.redirect contains "://" %}
          target="_blank" rel="noopener"
        {% endif %}
      >
        {% if figure %}
          <div class="plate-figure">
            <img src="{{ figure | relative_url }}" alt="{{ post.title | escape }}" loading="lazy">
          </div>
        {% endif %}
        <div class="plate-copy">
          {% if post.featured %}
            <p class="plate-kicker">pinned</p>
          {% endif %}
          <p class="plate-meta">
            {{ post.date | date: "%B %d, %Y" }}
            &nbsp;·&nbsp;
            {{ read_time }} min read
            {% if post.external_source %}
              &nbsp;·&nbsp; {{ post.external_source }}
            {% endif %}
          </p>
          <h3 class="plate-title">{{ post.title }}</h3>
          {% if teaser %}
            <p class="plate-teaser">{{ teaser | escape }}</p>
          {% endif %}
          {% if post.tags.size > 0 %}
            <div class="plate-tags">
              {% for tag in post.tags %}
                <span class="plate-tag">{{ tag }}</span>
              {% endfor %}
            </div>
          {% endif %}
        </div>
      </a>
    </li>
  {% endfor %}
</ul>

{% if page.pagination.enabled %}
{% include pagination.liquid %}
{% endif %}

</div>