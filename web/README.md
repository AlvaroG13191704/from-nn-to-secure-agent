# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@1.1.1 create --template minimal --types ts --install npm web
```

## Adding features

Add features to your project with `sv add`:

```sh
npx sv add
```

For example, to add Tailwind CSS:

```sh
npx sv add tailwindcss
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Presenter portrait

Place the presenter photo at `web/static/images/alvaro.jpg` (relative to the repository root).
SvelteKit serves static files without an import: `PresenterPortrait.svelte` references
`/images/alvaro.jpg`, prefixed with the configured base path. A 4:5 portrait of at least
800×1000 pixels works well; `object-fit: cover` crops it to the frame. The designed
placeholder remains visible when the file is absent or fails to load. Reload the page
after adding or replacing the file. Do not put private CV documents in `static/`.
