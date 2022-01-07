import { PASSWORD } from "./password";
import Sequin from "./sequinEvents";

const handler = Sequin.init({
  connection: {
    host: "YOUR_HOST",
    user: "YOUR_USER",
    password: PASSWORD,
    database: "YOUR_DB",
    port: 5432,
  },
  schema: "stripe",
});

handler.on("event", (ev) => {
  console.log(ev);
});
