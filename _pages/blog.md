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
        {% if post.external %}
          {% assign figure = nil %}
        {% else %}
          {% assign figure = post.preview_image | default: post.thumbnail %}
        {% endif %}
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

        <article class="tweet{% if post.external %} tweet-retweet{% endif %}">
          <a class="tweet-hit" href="{{ post_href }}"{% if post_external %} target="_blank" rel="noopener"{% endif %}><span class="sr-only">{{ post.title }}</span></a>
          {% if post.external %}
            {% assign retweet_author = post.coauthors | first | replace: "*", "" | strip %}
            <p class="retweet-context">
              <svg class="retweet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17 2l4 4-4 4"></path>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <path d="M7 22l-4-4 4-4"></path>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
              <span>{{ site.first_name }} {{ site.last_name }} Retweeted</span>
            </p>
          {% endif %}
          <img
            class="tweet-avatar"
            src="{% if post.external %}{{ '/assets/img/avatar-default.svg' | relative_url }}{% else %}{{ '/assets/img/az.png' | relative_url }}{% endif %}"
            alt=""
            width="48"
            height="48"
          >
          <div class="tweet-main">
            {% if post.external and post.card_links %}
              <div class="tweet-card-links">
                {% include plate_card_links.liquid links=post.card_links %}
              </div>
            {% endif %}
            <p class="tweet-meta">
              <span class="tweet-name">{% if post.external %}{{ retweet_author }}{% else %}{{ site.first_name }} {{ site.last_name }}{% endif %}</span>
              {% unless post.external %}
                {% if site.x_username %}
                  <span class="tweet-handle">@{{ site.x_username }}</span>
                {% endif %}
              {% endunless %}
              <span class="tweet-dot" aria-hidden="true">·</span>
              <time class="tweet-time" datetime="{{ post.date | date: '%Y-%m-%d' }}">{{ post.date | date: "%b %-d, %Y" }}</time>
            </p>
            <p class="tweet-text tweet-title">{{ post.title }}</p>
            {% if post.external and post.coauthors %}
              <p class="tweet-authors">
                {% for name in post.coauthors %}
                  {% if name contains "Alex" %}<strong>{{ name }}</strong>{% else %}{{ name }}{% endif %}{% unless forloop.last %}, {% endunless %}
                {% endfor %}
              </p>
            {% endif %}
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
