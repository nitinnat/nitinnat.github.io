---
layout: default
title: Work Experience
---

<h1>Work Experience 💼</h1>

<div class="experience-list">
  {% assign experiences = site.experiences | sort: 'end_date' | reverse %}
  {% for experience in experiences %}
    <div class="experience-item">
      <h2 class="experience-title">{{ experience.title }}</h2>
      <p class="experience-meta">
        {% if experience.start_date %}
          {{ experience.start_date | date: "%b %Y" }} &ndash; 
          {% if experience.end_date %}
            {{ experience.end_date | date: "%b %Y" }}
          {% else %}
            Present
          {% endif %}
        {% endif %}
      </p>
      {% if experience.image %}
        <div class="experience-image">
          <img src="{{ experience.image | relative_url }}" alt="{{ experience.title }} image" loading="lazy">
        </div>
      {% endif %}
      <div class="experience-description">
        {{ experience.content }}
      </div>
    </div>
  {% endfor %}
</div>

<style>
  .experience-list {
    margin-top: 20px;
  }
  .experience-item {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }
  .experience-title {
    margin-top: 0;
    color: #008AFF;
  }
  .experience-meta {
    font-style: italic;
    color: #777;
    margin-bottom: 15px;
  }
  .experience-image {
    text-align: center;
    margin-bottom: 15px;
  }
  .experience-image img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
  }
  .experience-description {
    line-height: 1.6;
  }
</style>
