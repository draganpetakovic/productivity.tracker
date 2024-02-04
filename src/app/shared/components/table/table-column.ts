export type TableColumn = TextColumn | DecimalColumn | EditDatetimeColumn;

export type TextColumn = {
  field: string;
  title: string;
  type: 'text';
};

export type DecimalColumn = {
  field: string;
  title: string;
  type: 'decimal';
};

export type EditDatetimeColumn = {
  field: string;
  title: string;
  type: 'editDatetime';
};
