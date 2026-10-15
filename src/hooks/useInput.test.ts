import { describe, it, expect } from "vitest";
import useInput from "./useInput";

describe("useInput", () => {
  it("memakai nilai awal dan memperbarui nilai lewat event maupun setter", () => {
    const [value, handleValueChange, setValue] = useInput("awal");
    expect(value.value).toBe("awal");

    handleValueChange({ target: { value: "dari-event" } });
    expect(value.value).toBe("dari-event");

    setValue("langsung");
    expect(value.value).toBe("langsung");

    value.value = "lewat-properti";
    expect(value.value).toBe("lewat-properti");
  });

  it("memakai string kosong sebagai default dan menerima nilai tanpa event", () => {
    const [value, handleValueChange] = useInput();
    expect(value.value).toBe("");

    handleValueChange("nilai-langsung");
    expect(value.value).toBe("nilai-langsung");

    handleValueChange({ target: {} } as never);
    expect(value.value).toEqual({ target: {} });

    handleValueChange(null as never);
    expect(value.value).toBeNull();
  });
});
