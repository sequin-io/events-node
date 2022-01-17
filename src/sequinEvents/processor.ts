import { EventEmitter2 } from "eventemitter2";
import { Pool, PoolConfig } from "pg";

export interface ProcessorOptions {
  groupName: string;
  connection: PoolConfig;
  schema: string;
}

export const DEFAULT_OPTIONS: Omit<ProcessorOptions, "connection" | "schema"> =
  {
    groupName: "default",
  };

const EVENT_CHANNEL_NAME = "new_sync_event";
const GET_EVENT_QUERY = `
select * from stripe._sync_event
where id > $1
limit 1
`;

export default class Processor extends EventEmitter2 {
  private _config: ProcessorOptions;
  public get config(): ProcessorOptions {
    return this._config;
  }

  private _pool: Pool;
  private _scheduledTimeout?: NodeJS.Timeout;

  constructor(config: ProcessorOptions) {
    super();

    this._config = config;
    this._pool = new Pool(config.connection);

    this.start();
  }

  public async start() {
    try {
      await this.processAll();
      await this.setupSubscription();
      this.scheduleProcess();
    } catch {
      console.error(
        "Sync event listener failed to boot. Retrying in 5 seconds..."
      );
      setTimeout(() => this.start(), 5000);
    }
  }

  private async setupSubscription() {
    const client = await this._pool.connect();

    // We say we want to listen to our event channel
    await client.query(`LISTEN ${EVENT_CHANNEL_NAME}`);

    // Doesn't matter if we didn't catch the event,
    // the cursor will not move
    client.on("notification", (msg) => {
      if (msg.channel === EVENT_CHANNEL_NAME) {
        // Hey, that's something we want.
        // Time to move the cursor through the events.
        this.processAll();
      }
    });
  }

  private async processAll(countProcessed = 0) {
    try {
      const n = await this.lockAndProcess();
      if (n === 0) {
        console.log(`Processed ${countProcessed} events.`);
      } else {
        this.processAll(countProcessed + n);
      }
    } catch {}
  }

  private async lockAndProcess() {
    const client = await this._pool.connect();

    const query = `select stripe._assign_event_cursor('${this._config.groupName}', 'FROM_NOW')`;

    let result = 0;

    try {
      // Begin the transaction
      await client.query("BEGIN");

      // Acquire lock, get cursor offset
      const res = await client.query(query);
      const offset = res.rows[0]._assign_event_cursor;

      if (!offset) {
        // We failed. Rollback.
        throw new Error("no-lock");
      }

      // We succeeded. Handle the next event.
      const res2 = await client.query(GET_EVENT_QUERY, [offset]);

      if (res2.rowCount === 0) {
        result = 0;
      } else {
        const event = res2.rows[0];

        try {
          await this.handleEvent(event);

          // Update the cursor offset and release the lock
          await client.query(
            "update stripe._sync_event_cursor set group_offset = $1 where group_name = $2",
            [event.id, this._config.groupName]
          );

          result = 1;
        } catch {
          // Wait until next tick to continue
          result = 0;
        }
      }

      // End the transaction
      await client.query("COMMIT");
    } catch (err) {
      // Something bad happened...
      // Rollback the transaction
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return result;
  }

  private async handleEvent(event: any) {
    await this.emitAsync("event", event);
  }

  private scheduleProcess() {
    this._scheduledTimeout = setTimeout(() => {
      this.handleScheduledProcess();
    }, 10000);
  }

  private async handleScheduledProcess() {
    try {
      await this.processAll();
    } catch {
    } finally {
      this.scheduleProcess();
    }
  }
}
