# DATA

**This directory is required only if you are planning on making some pages dynamic, you can delete it if you don't want to use it.**

This directory contains your application "dynamic" data. You can use this folder to keep data that will be used in your application pages.

For example, let's say you have an `index.html` page that has a `name` variable. You can add that variable in the `./default.json`.

```
# resources/views/index.html
<p>My name is: {{name}}</p>

# resources/views/data/default.json
{
    "name": "R2-D2"
}

# dist/html/index.html
<p>My name is: R2-D2</p>
```

If you want to organize your code, instead of adding the variable in `./default.json`, you can create a `.json` file with the _full template name_. For example, if you have an `index.html` template, you would create an `index.html.json` to hold the template data.
```
# resources/views/index.html
<p>My name is: {{name}}</p>

# resources/views/data/index.html.json
{
    "name": "BB-8"
}

# dist/html/index.html
<p>My name is: BB-8</p>
```