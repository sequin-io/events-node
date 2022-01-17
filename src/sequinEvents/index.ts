import { Optional } from "./types";
import Processor, { DEFAULT_OPTIONS, ProcessorOptions } from "./processor";

const processorStore: Processor[] = [];

function init(options: Optional<ProcessorOptions, "groupName">) {
  const finalOptions: ProcessorOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (!finalOptions.schema) {
    throw new Error(
      `Sequin.init() missing option \`schema\`.

       Find the schema for the sync you're connecting to on your Sequin console (https://app.sequin.io). If you're syncing to a Sequin-hosted database, the schema is \`public\`.`
    );
  }

  const processor = new Processor(finalOptions);
  processorStore.push(processor);

  return processor;
}

function conn(groupName: string = "default") {
  const store = processorStore.find((p) => p.config.groupName === groupName);

  if (!store) {
    throw new Error(`No processor available for group "${groupName}"`);
  }
}

export default {
  init,
  conn,
};
