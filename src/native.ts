import { registerPlugin } from "@capacitor/core";
export const SaveFile = registerPlugin<{
  save(options: { name: string; content: string }): Promise<void>;
}>("SaveFile");
