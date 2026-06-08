import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
  apiBaseUrl: {
    type: OptionType.STRING,
    description: "Liquidcord backend base URL",
    default: "https://liquidcord.opai.lat",
  },
});
