import { Optional } from "./types";
import Processor, { DEFAULT_OPTIONS, ProcessorOptions } from "./processor";

const processorStore: Processor[] = [];

function init(options: Optional<ProcessorOptions, "groupName" | "schema">) {
  const finalOptions: ProcessorOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const processor = new Processor(finalOptions);
  processorStore.push(processor);

  return processor;
}

function conn(groupName: string = "default") {
  const find = processorStore.find((p) => p.config.groupName === groupName);

  if (!find) {
    throw new Error(`No processor available for group "${groupName}"`);
  }
}

export default {
  init,
  conn,
};
