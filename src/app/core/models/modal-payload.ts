export type ModalPayload<T> = ActionPayload<T> | CancelPayload;

export type ActionPayload<T> = {
  type: 'action';
  payload: T;
};

export type CancelPayload = {
  type: 'cancel';
};
