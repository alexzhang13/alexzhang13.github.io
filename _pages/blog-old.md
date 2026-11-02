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

<div class="post kitchen" id="kitchen">
<script>
  try {
    if (localStorage.getItem("hide-external-posts") === "1") {
      document.getElementById("kitchen").classList.add("is-hiding-external");
    }
  } catch (e) {}
</script>

{% assign blog_description_size = site.blog_description | size %}

{% if blog_description_size > 0 %}
  <p class="kitchen-blurb">
    <strong>working notes.</strong> {{ site.blog_description }} a blast to the past <a class="vim-twitter" href="{{ '/blog/fun/' | relative_url }}">twitter</a> view
  </p>
{% endif %}

<label class="external-toggle">
  <input type="checkbox" id="hide-external-posts">
  <span class="external-switch" aria-hidden="true"></span>
  Hide External Posts
</label>

<script src="{{ '/assets/js/vim-twitter.js' | relative_url }}"></script>

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
{% endif %}

<ul class="kitchen-plates">
  {% for post in postlist %}
    {% if post.external_source == blank %}
      {% assign read_time = post.content | number_of_words | divided_by: 180 | plus: 1 %}
    {% else %}
      {% assign read_time = post.feed_content | strip_html | number_of_words | divided_by: 180 | plus: 1 %}
    {% endif %}
    {% assign teaser = post.preview | default: post.description %}
    {% if post.external %}
      {% assign figure = nil %}
    {% elsif on_first_page %}
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

    <li class="plate{% if post.external %} plate-text plate-external{% elsif figure %} plate-has-figure{% else %} plate-text{% endif %}">
      {% if figure %}
        <div class="plate-figure">
          <img src="{{ figure | relative_url }}" alt="{{ post.title | escape }}" loading="lazy">
        </div>
      {% endif %}
      <div class="plate-copy">
        <div class="plate-top">
          <p class="plate-meta">
            {{ post.date | date: "%B %d, %Y" }}
            {% unless post.external %}
              &nbsp;·&nbsp;
              {{ read_time }} min read
            {% endunless %}
            {% if post.external_source %}
              &nbsp;·&nbsp; {{ post.external_source }}
            {% endif %}
          </p>
          {% if post.card_links %}
            {% include plate_card_links.liquid links=post.card_links %}
          {% endif %}
        </div>
        <h3 class="plate-title">
          <a
            href="{{ post_href }}"
            {% if post.redirect contains "://" %}
              target="_blank" rel="noopener"
            {% endif %}
          >{{ post.title }}</a>
        </h3>
        {% if post.external and post.coauthors %}
          <p class="plate-authors">
            {% for name in post.coauthors %}
              {% if name contains "Alex" %}<strong>{{ name }}</strong>{% else %}{{ name }}{% endif %}{% unless forloop.last %}, {% endunless %}
            {% endfor %}
          </p>
        {% endif %}
        {% if teaser %}
          <p class="plate-teaser">{{ teaser | escape }}</p>
        {% endif %}
        {% if post.tags.size > 0 %}
          <p class="plate-tags">{{ post.tags | join: ", " }}</p>
        {% endif %}
        {% if post.external %}
          <div class="plate-external-mark">
            <span class="plate-external-tag">[external]</span>
            <span class="plate-link-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 5h5v5"></path>
                <path d="M19 5l-9 9"></path>
                <path d="M17 13.5V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5.5"></path>
              </svg>
            </span>
          </div>
        {% endif %}
      </div>
    </li>
  {% endfor %}
</ul>

{% if page.pagination.enabled %}
{% include pagination.liquid %}
{% endif %}

<script>
  (function () {
    var kitchen = document.getElementById("kitchen");
    var input = document.getElementById("hide-external-posts");
    if (!kitchen || !input) return;

    function apply(hide) {
      kitchen.classList.toggle("is-hiding-external", hide);
      try {
        localStorage.setItem("hide-external-posts", hide ? "1" : "0");
      } catch (e) {}
    }

    var hide = kitchen.classList.contains("is-hiding-external");
    input.checked = hide;
    input.addEventListener("change", function () {
      apply(input.checked);
    });
  })();
</script>

</div>
