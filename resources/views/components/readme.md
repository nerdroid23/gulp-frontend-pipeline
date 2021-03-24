# COMPONENTS

**This directory is not required, you can delete it if you don't want to use it.**

This directory contains your application views components (i.e _navbar, carousel, cards_). You can use this folder to keep your view **DRY**.

As an example, a dynamic card component could be structured like this:
```twig
# resources/views/components/characters-list.html
{% macro charactersList(characters) %}
<ul>
  {% for character in characters %}
  <li>{{character}}</li>
  {% endfor %}
</ul>
{% endmacro %}
```

This would be the data we want to use in the component if it's dynamic:
```json
# resources/views/data/index.html.json
{
    "characters": [
    "Luke Skywalker",
    "Princess Leia",
    "Kylo Ren",
    "C-3PO",
    "General Hux"
  ]
}
```

It could also be a static component:
```html
<ul>
    <li>Luke Skywalker</li>

    <li>Princess Leia</li>

    <li>Kylo Ren</li>

    <li>C-3PO</li>

    <li>General Hux</li>
</ul>
```

This is how it would be used in a template file as a dynamic component:
```twig
# resources/views/index.html
{% from "components/characters-list.html" import charactersList %}

<div>
    {{charactersList(characters)}}
</div>
```

This is how it would be used in a template file as a static component:
```twig
# resources/views/index.html

<div>
    {% include "components/characters-list.html" %}
</div>
```

This is what it would render like after compilation:
```html
# dist/html/index.html

<div>
    <ul>
        <li>Luke Skywalker</li>

        <li>Princess Leia</li>

        <li>Kylo Ren</li>

        <li>C-3PO</li>

        <li>General Hux</li>
    </ul>
</div>
```
