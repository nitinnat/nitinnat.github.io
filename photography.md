---
layout: default
title: Photography
---

<h1>Photography 📸</h1>

<div class="facet-filter">
  <button class="filter-button active" data-filter="all">All</button>
  {% for folder in site.static_files %}
    {% if folder.path contains 'images/' %}
      {% assign dirname = folder.path | split: '/' %}
      {% assign location = dirname[2] %}
      {% unless locations contains location %}
        {% assign locations = locations | append: location | append: ',' %}
      {% endunless %}
    {% endif %}
  {% endfor %}
  {% assign locations = locations | split: ',' | uniq %}
  {% for location in locations %}
    <button class="filter-button" data-filter="{{ location | slugify }}">{{ location | replace: '_', ' ' | capitalize }}</button>
  {% endfor %}
</div>

<div class="gallery-grid">
  {% for folder in site.static_files %}
    {% if folder.path contains 'images/' %}
      {% assign dirname = folder.path | split: '/' %}
      {% assign location = dirname[2] %}
      <div class="gallery-item {{ location | slugify }}">
        <a href="{{ folder.path | relative_url }}" data-lightbox="{{ location }}" data-title="{{ location | replace: '_', ' ' | capitalize }}">
          <img src="/images/thumbs/{{ folder.path | split: '/' | last }}" alt="{{ location | replace: '_', ' ' | capitalize }}" loading="lazy">
        </a>
      </div>
    {% endif %}
  {% endfor %}
</div>

<link rel="stylesheet" href="/css/lightbox.min.css">
<script src="/js/lightbox-plus-jquery.min.js"></script>
<script>
  $(document).ready(function(){
    // Lightbox options
    lightbox.option({
      'resizeDuration': 200,
      'wrapAround': true
    });

    // Filter functionality
    $('.filter-button').on('click', function(){
      var filter = $(this).data('filter');
      
      $('.filter-button').removeClass('active');
      $(this).addClass('active');
      
      if(filter == 'all'){
        $('.gallery-item').hide().fadeIn('slow');
      } else {
        $('.gallery-item').hide();
        $('.gallery-item.' + filter).fadeIn('slow');
      }
    });
  });
</script>

<style>
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
    margin-top: 20px;
  }
  .gallery-item img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 8px;
    transition: transform 0.3s ease-in-out;
  }
  .gallery-item img:hover {
    transform: scale(1.05);
  }
  .facet-filter {
    text-align: center;
    margin-bottom: 20px;
  }
  .filter-button {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    padding: 8px 16px;
    margin: 0 5px;
    cursor: pointer;
    border-radius: 5px;
    transition: background-color 0.3s;
  }
  .filter-button:hover {
    background-color: #e0e0e0;
  }
  .filter-button.active {
    background-color: #008AFF;
    color: white;
    border-color: #008AFF;
  }
</style>
