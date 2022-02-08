# sync-events

This library provides an event processor for events of syncs schemas.

# Usage with TypeScript

## Installation

We don't provide a npm package yet for this library. To install it, simply copy the folder `src/sequinEvents` to your working directory and import default from it.

```tsx
import Sequin from "./sequinEvents";
```

## Usage

### Initialize an handler instance

You can initialize a global instance of the event handler for your database schema by calling the `init` function with your database connection details.

```tsx
const handler = Sequin.init({
  connection: {
    host: "YOUR_DATABASE_HOST",
    user: "YOUR_DATABASE_USER",
    password: "YOUR_DATABASE_PASSWORD",
    database: "YOUR_DATABASE_NAME",
    port: 5432,
  },
  schema: "public",
  groupName: "default", // Optional - used to separate cursor position between contexts.
});
```

There can be only one handler instance per group name. It will be stored internally to be accessed from anywhere within the context of the module.

### Retrieve an handler instance

To retrieve an handler instance, use the function `conn` specified by the desired group name which you want to get the handler:

```tsx
const handler = Sequin.conn(); // Defaults to "default"
const handler = Sequin.conn("dashboard_app"); // Will return some other handler
```

If no processor was previously instantiated for the group name, an exception will be thrown.

### Handling events

To handle processed events, add a listener to the `event` channel:

```tsx
handler.on("event", (ev: SequinEvent) => {
  console.log(ev);
});
```

Where `ev` is an object of type:

```tsx
interface SequinEvent {
  id: number;
  event_type: "insert" | "update" | "delete";
  object_type: string;
  payload: any;
}
```
