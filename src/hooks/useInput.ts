export interface InputValue<T> {
  value: T;
}

type ValueChangeEvent<T> = { target?: { value?: T } | null } | T;

export default function useInput<T = string>(defaultValue: T = "" as T) {
  let val = defaultValue;
  const value: InputValue<T> = {
    get value() {
      return val;
    },
    set value(v: T) {
      val = v;
    },
  };

  function handleValueChange(event: ValueChangeEvent<T>) {
    const target = (event as { target?: { value?: T } })?.target;
    value.value = target?.value !== undefined ? target.value : (event as T);
  }

  return [
    value,
    handleValueChange,
    (v: T) => {
      value.value = v;
    },
  ] as const;
}
