[https://georgi-nikolov.com](https://georgi-nikolov.com)

![Homepage render](/src/assets/georgi-nikolov-social-preview.png?raw=true)

# Personal portfolio 2021

Source codes for my new website. It is written as a pure webgl scene. I wrote a custom layouting system for the text positions and the boxes.

### Tools used

- my own lightweight webgl library [hwoa-rang-gl](https://gnikoloff.github.io/hwoa-rang-gl/) to power the graphics of the website
- redux for state management
- popmotion for animation
- typescript for neat code

### Run locally

```
git clone --recurse-submodules git@github.com:gnikoloff/2021-portfolio.git
cd 2021-portfolio

// install dependencies
npm install

// watch files & start server
npm run start:local
```

#### Tasks

```
"lint"        - lint project
"watch"       - watch files in dev mode
"build"       - build production ready files
"serve"       - serve project
"start":      - "build" and "serve"
"start:local" - "watch" and "serve"
```

#### Development mode

To access FPS meter, shadow map debug view and texture atlas debug view, simply append `?debugMode=1` as a query param at the end of the url

![Debug view](/src/assets/debug-view.png?raw=true)
