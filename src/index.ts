import { PASSWORD } from "./password";
import Sequin from "./sequinEvents";

const handler = Sequin.init({
  connection: {
    host: "dev-1-sao.crv9u2i6qbrd.sa-east-1.rds.amazonaws.com",
    user: "postgres",
    password: PASSWORD,
    database: "ghola_dev_kayky",
    port: 5432,
  },
  schema: "stripe",
});

handler.on("event", (ev) => {
  console.log(ev);
});
