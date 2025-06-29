---
layout: default
title: Photography
---

<h1>Photography 📸</h1>

<div class="facet-filter">
  <button class="filter-button active" data-filter="all">All</button>
  <button class="filter-button" data-filter="lake-tahoe">Lake Tahoe</button>
  <button class="filter-button" data-filter="san-francisco">San Francisco</button>
  <button class="filter-button" data-filter="oregon">Oregon</button>
</div>

<div class="gallery-grid">
  {% for image in site.static_files %}
    {% if image.path contains 'images/lake_tahoe' %}
      <div class="gallery-item lake-tahoe">
        <a href="{{ image.path | relative_url }}" data-lightbox="lake-tahoe" data-title="Lake Tahoe">
          <img src="{{ image.path | relative_url }}" alt="Lake Tahoe">
        </a>
      </div>
    {% endif %}
    {% if image.path contains 'images/san_francisco' %}
      <div class="gallery-item san-francisco">
        <a href="{{ image.path | relative_url }}" data-lightbox="san-francisco" data-title="San Francisco">
          <img src="{{ image.path | relative_url }}" alt="San Francisco">
        </a>
      </div>
    {% endif %}
    {% if image.path contains 'images/oregon_2025' %}
      <div class="gallery-item oregon">
        <a href="{{ image.path | relative_url }}" data-lightbox="oregon" data-title="Oregon">
          <img src="{{ image.path | relative_url }}" alt="Oregon">
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