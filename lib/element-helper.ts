import { log } from "./utils";
import { INsCapabilities } from "./interfaces/ns-capabilities";
import { Locator } from "./locators";

export class ElementHelper {

    private locators: Locator;

    constructor(private _args: INsCapabilities) {
        this.locators = new Locator(this._args)
    }

    public getXPathElement(name) {
        const tempName = name.toLowerCase().replace(/\-/g, "");
        return `//${this.locators.getElementByName(tempName)}`;
    };

    public getXPathByText(text, exactMatch) {
        return this.findByTextLocator("*", text, exactMatch);
    }

    public getXPathWithExactText(text) {
        return this.getXPathByText(text, true);
    }

    public getXPathContainingText(text) {
        return this.getXPathByText(text, false);
    }

    public findByTextLocator(controlType, value, exactMatch) {
        const result = this.getXPathByTextAttributes(`//${controlType}`, value, exactMatch);
        return result;
    }

    public getXPathByTextAttributes(controlType, textValue, exactMatch) {
        let attributes = ["label", "value", "hint"];
        if (this._args.isAndroid) {
            attributes = ["content-desc", "resource-id", "text"];
        }

        let searchedString = "";
        if (exactMatch) {
            if (this._args.isAndroid) {
                attributes.forEach((atr) => { searchedString += "translate(@" + atr + ",'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz')='" + textValue.toLowerCase() + "'" + " or " });
            } else {
                attributes.forEach((atr) => { searchedString += "@" + atr + "='" + textValue + "'" + " or " });
            }
        } else {
            if (this._args.isAndroid) {
                attributes.forEach((atr) => { searchedString += "contains(translate(@" + atr + ",'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'" + textValue.toLowerCase() + "')" + " or " });
            } else {
                attributes.forEach((atr) => { searchedString += "contains(@" + atr + ",'" + textValue + "')" + " or " });
            }
        }

        searchedString = searchedString.substring(0, searchedString.lastIndexOf(" or "));
        const result = `${controlType}[${searchedString}]`;
        log("Xpath: " + result, this._args.verbose);

        return result;
    }
}