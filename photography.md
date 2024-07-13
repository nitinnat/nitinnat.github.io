---
layout: default
title: Photography
permalink: /photography/
---

<h1>Photography</h1>
<div class="places-grid">
  {% for place in site.places %}
    <div class="place-item">
      <a href="{{ place.url }}">
        <h2>{{ place.title }}</h2>
        <img src="{{ place.images[0].path }}" alt="Image from {{ place.title }}">
      </a>
    </div>
  {% endfor %}
</div>

<style>
  .places-grid {
    display: flex;
    flex-wrap: wrap;
  }
  .place-item {
    width: 30%; /* Adjust as needed */
    margin: 10px;
  }
  .place-item img {
    width: 100%;
    height: auto;
  }
</style>
