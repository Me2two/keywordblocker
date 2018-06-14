import { BlockDialog } from "@options/models/blockDialog";
import { BlockItem } from "@options/models/blockItem";
import { BlockOverlay } from "@options/models/blockOverlay";
export { BlockItem } from "@options/models/blockItem";
export { BlockDialog } from "@options/models/blockDialog";
export { BlockOverlay } from "@options/models/blockOverlay";
import { YouTubePage } from "@blocker/youtube";
import { BlockOption } from "@options/models/blockOption";
export { BlockOption } from "@options/models/blockOption";
import "chrome-extension-async";

export enum BlockAction {
    Nothing = 0,
    Block = 1,
    Remove = 2,
    Redirect = 3,
}

export class Settings {
    public static async load(): Promise<Settings> {
        return Settings.fromLocalStorage(await chrome.storage.local.get());
    }

    public static fromImportedSettings(importedSettings: { [key: string]: any }): Settings {
        return this.fromLocalStorage(importedSettings);
    }

    private static fromLocalStorage(localStorageData: { [key: string]: any }): Settings {
        if (localStorageData.settingsVersion === 2) {
            const storedSettings = localStorageData;
            const settings = new Settings();
            settings.blockDialog = new BlockDialog(storedSettings.blockDialog.text, storedSettings.blockDialog.image);
            settings.blockOverlay = new BlockOverlay(storedSettings.blockOverlay.text,
                storedSettings.blockOverlay.color);
            settings.checkDescription = storedSettings.checkDescription;
            settings.password = storedSettings.password;
            settings.channels = storedSettings.channels
                .map((x: any) => new BlockItem(x.keyword, x.blockPartialMatch));
            settings.keywords = storedSettings.keywords
                .map((x: any) => new BlockItem(x.keyword, x.blockPartialMatch));
            settings.blockOptions = storedSettings.blockOptions
                .map((x: any) => new BlockOption(x.page, x.action));
            return settings;
        } else if (Object.keys(localStorageData).length === 0) {
            return new Settings();
        } else {
            return this.convertOldSettings(localStorageData);
        }
    }

    private static convertOldSettings(oldSettings: { [key: string]: any }): Settings {
        const settings = new Settings();
        if (typeof oldSettings.removeFromResults !== "undefined") {
            const blockSetting = oldSettings.removeFromResults ? BlockAction.Block : BlockAction.Nothing;
            settings.setBlockOption(YouTubePage.Frontpage, blockSetting);
            settings.setBlockOption(YouTubePage.Search, blockSetting);
            settings.setBlockOption(YouTubePage.Trending, blockSetting);
            settings.setBlockOption(YouTubePage.Subscriptions, blockSetting);
            settings.setBlockOption(YouTubePage.Channel, blockSetting);
            settings.setBlockOption(YouTubePage.Video, blockSetting);
        }
        if (oldSettings.checkDescription) {
            settings.checkDescription = oldSettings.checkDescription;
        }
        if (oldSettings.password) {
            settings.password = oldSettings.password;
        }
        if (oldSettings.popOver) {
            settings.blockDialog.text = oldSettings.popOver.text;
            settings.blockDialog.image = oldSettings.popOver.image;
        }
        if (oldSettings.keywords) {
            for (const oldKeyword of oldSettings.keywords) {
                settings.keywords.push(new BlockItem(oldKeyword));
            }
        }
        if (oldSettings.wildcardKeywords) {
            for (const oldKeyword of oldSettings.wildcardKeywords) {
                settings.keywords.push(new BlockItem(oldKeyword, true));
            }
        }
        if (oldSettings.channels) {
            for (const oldChannel of oldSettings.channels) {
                settings.channels.push(new BlockItem(oldChannel));
            }
        }
        if (oldSettings.wildcardChannels) {
            for (const oldChannel of oldSettings.channels) {
                settings.channels.push(new BlockItem(oldChannel, true));
            }
        }
        return settings;
    }

    public password: string = "";
    public keywords: BlockItem[] = [];
    public channels: BlockItem[] = [];
    public blockDialog: BlockDialog = new BlockDialog("Blocked!", "https://i.imgur.com/sLmiP5n.png");
    public blockOverlay: BlockOverlay = new BlockOverlay("Blocked", "#CC181E");
    public blockOptions: BlockOption[] = [];
    public checkDescription: boolean = true;
    public settingsVersion: number = 2;

    private constructor() {
    }

    public async save(): Promise<void> {
        console.log("SAVING");
        await chrome.storage.local.set(this);
    }

    public setBlockOption(page: YouTubePage, action: BlockAction): void {
        const index = this.blockOptions.findIndex((i) => i.page === page);
        if (index === -1) {
            this.blockOptions.push(new BlockOption(page, action));
        } else {
            this.blockOptions[index].action = action;
        }
        console.log(this.blockOptions);
    }

    public getBlockAction(page: YouTubePage): BlockAction {
        const index = this.blockOptions.findIndex((i) => i.page === page);
        if (index !== -1) {
            return this.blockOptions[index].action;
        }
        return BlockAction.Nothing;
    }
}
