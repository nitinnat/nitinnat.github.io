---
layout: default
title: Photography
---

<h1>Photography</h1>

<div class="facet-filter">
  <button class="filter-button active" data-filter="all">All</button>
  {% for place in site.places %}
    <button class="filter-button" data-filter="{{ place.title | slugify }}">{{ place.title }}</button>
  {% endfor %}
</div>

<div class="gallery-grid">
  {% for place in site.places %}
    {% for image in place.images %}
      <div class="gallery-item {{ place.title | slugify }}">
        <a href="{{ image.path | relative_url }}" data-lightbox="{{ place.title }}" data-title="{{ image.caption }}">
          <img src="{{ image.path | relative_url }}" alt="{{ image.caption }}">
        </a>
      </div>
    {% endfor %}
  {% endfor %}
</div>

<link rel="stylesheet" href="/css/lightbox.min.css">
<script src="/js/lightbox-plus-jquery.min.js"></script>
<script>
  $(document).ready(function(){
    $('.filter-button').on('click', function(){
      var filter = $(this).data('filter');
      if(filter == 'all'){
        $('.gallery-item').show();
      } else {
        $('.gallery-item').hide();
        $('.gallery-item.' + filter).show();
      }
      $('.filter-button').removeClass('active');
      $(this).addClass('active');
    });
  });
</script>
<style>
  .gallery-grid {
    display: flex;
    flex-wrap: wrap;
  }
  .gallery-item {
    width: 30%; /* Adjust as needed */
    margin: 10px;
  }
  .gallery-item img {
    width: 100%;
    height: auto;
  }
  .filter-button.active {
    font-weight: bold;
  }
</style>
