# The new Bryntum Grid lazyLoad feature: Starter code

## Install the dependencies

First install the dependencies by running the following command:

```bash
npm install
```

> Note that the lazyLoad feature is available from Bryntum Grid Version 6.

Now install the Bryntum Grid component using npm. First, get access to the Bryntum private npm registry by following the [guide in our docs](https://www.bryntum.com/products/grid/docs/guide/Grid/quick-start/javascript-npm#access-to-npm-registry). When you’ve logged in to the registry, install the Bryntum Grid component by following [this guide](https://www.bryntum.com/products/grid/docs/guide/Grid/quick-start/javascript-npm#install-component).

## Run the local dev server

Run the local dev server by running the following command:

```bash
npm start
```

Open [http://localhost:1337/](http://localhost:1337/), and you’ll see a Bryntum Grid with 100,000 rows of data. The Grid will have full CRUD functionality. There is no database – the data is stored in the `sessionData` variable in the `server.js` file. Any data changes will be lost when you restart the dev server. 
