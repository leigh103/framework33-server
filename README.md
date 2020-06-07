# framework33-server
NodeJS server component of Framework33

## Installation

(The default setup uses ArangoDB, however more database connectors will become available)

1. Install ArangoDB - https://www.arangodb.com/download-major/ubuntu/
2. Install Redis - apt-get install redis-server
3. git clone https://github.com/leigh103/framework33-server
4. npm install
5. Edit modules/config.js and add in your database name, username and password
5. nodejs server-33.js
6. Open http://localhost:8033 in your browser

### Config Options

Edit modules/config.js to update API keys and set server ports. You can also edit modules/view.js to update settings related to the web view, so things like meta title etc.

### Components, models and modules

Essentially these are all the same thing, simple NodeJS modules with exported functions and data. However Framework33 treats them differently, depending on where they are located - creating components, models and modules.

Components - these are web components, which contain routes, views and even shared functions. They can also have an optional static files folder, to serve specific files related to the component. All components in the component directory are added at startup and are hot reloaded if changed, or added. Think of these as a single component which adds functionality when plugged in, eg, the authentication component provides all auth routes, along with password reset routes and menu options.

Models - these can be used to add additional functionality to the data from the database, and are usually tied to a database table. Things like user related functions are included in these files and their functionality can be shared across components. These are also hot reloaded.

Modules - these add core functionality such as the config.js file, notification functionality and websocket server. They are not hot reloaded.

### Why this structure

It's a work in progress and subject to change, but I like the ability to plug in components to add routes and functionality to a website on the fly, and I feel this structure works quite well. A 'product' component, along with a 'checkout' component could create an ecommerce site, a 'content' component could create a blog site and a 'dashboard' component could be used to manage all the data between components.

Think of it like VueJS's single file components, mixed with Laravel's model functionality.
