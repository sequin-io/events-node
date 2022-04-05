export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

interface BaseEvent {
  id: string;
  inserted_at: string;
  object_type: string;
}

interface InsertEvent<T> extends BaseEvent {
  event_type: "insert";
  payload: {
    record_id: string;
    record: T;
  };
}

interface UpdateEvent<T> extends BaseEvent {
  event_type: "update";
  payload: {
    record_id: string;
    record: T;
    old_record: T;
    changes: Partial<T>;
  };
}

interface DeleteEvent<T> extends BaseEvent {
  event_type: "delete";
  payload: {
    record_id: string;
    record: T;
  };
}

export type SequinEvent<T> = InsertEvent<T> | UpdateEvent<T> | DeleteEvent<T>;
