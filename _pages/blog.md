---
layout: default
permalink: /blog/fun/
title: fun
description: high-quality and concise technical posts
nav: false
timeline: true
---

<div class="timeline">
  <h1 class="sr-only">Timeline</h1>
  <div class="timeline-grid">
    {% include timeline_left.liquid %}

    <section class="timeline-feed" aria-label="Blogs">
      {% for post in site.posts %}
        {% assign teaser = post.preview | default: post.description %}
        {% assign figure = post.preview_image | default: post.thumbnail %}
        {% if post.redirect == blank %}
          {% assign post_href = post.url | relative_url %}
          {% assign post_external = false %}
        {% elsif post.redirect contains "://" %}
          {% assign post_href = post.redirect %}
          {% assign post_external = true %}
        {% else %}
          {% assign post_href = post.redirect | relative_url %}
          {% assign post_external = false %}
        {% endif %}

        <article class="tweet">
          <a class="tweet-hit" href="{{ post_href }}"{% if post_external %} target="_blank" rel="noopener"{% endif %}><span class="sr-only">{{ post.title }}</span></a>
          <img
            class="tweet-avatar"
            src="{{ '/assets/img/az.png' | relative_url }}"
            alt=""
            width="48"
            height="48"
          >
          <div class="tweet-main">
            <p class="tweet-meta">
              <span class="tweet-name">{{ site.first_name }} {{ site.last_name }}</span>
              {% if site.x_username %}
                <span class="tweet-handle">@{{ site.x_username }}</span>
              {% endif %}
              <span class="tweet-dot" aria-hidden="true">·</span>
              <time class="tweet-time" datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date: "%b %-d, %Y" }}</time>
            </p>
            <p class="tweet-text tweet-title">{{ post.title }}</p>
            {% if teaser and teaser != post.title %}
              <p class="tweet-text">{{ teaser }}</p>
            {% endif %}
            {% if figure %}
              <div class="tweet-media">
                <img
                  src="{{ figure | relative_url }}"
                  alt=""
                  {% if forloop.first %}
                    loading="eager"
                  {% else %}
                    loading="lazy"
                  {% endif %}
                >
              </div>
            {% endif %}
            {% include tweet_actions.liquid %}
          </div>
        </article>
      {% endfor %}
    </section>

    {% include timeline_right.liquid %}
  </div>
</div>
