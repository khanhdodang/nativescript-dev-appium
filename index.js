    require("./appium-setup");
    const glob = require("glob");
    const wd = require("wd");
    const utils = require("./utils");
    const elementFinder = require("./element-finder");

    const testRunType = process.env.npm_config_runType;
    const isSauceLab = process.env.npm_config_sauceLab;
    const customCapabilitiesConfigs = utils.capabilitiesLocation;
    let customCapabilities;
    let caps;

    if (customCapabilitiesConfigs) {
        customCapabilities = JSON.parse(customCapabilitiesConfigs)
    } else {
        throw new Error("No capabilities provided!!!");
    }

    exports.createDriver = (capabilities, activityName) => {
        caps = capabilities;
        if (!activityName) {
            activityName = "com.tns.NativeScriptActivity";
        }

        if (!caps) {
            caps = customCapabilities[testRunType];
            if (!caps) {
                throw new Error("Incorrect test run type: " + testRunType + " . Available run types are :" + customCapabilitiesConfigs);
            }
        }

        let config = {
            host: "localhost",
            port: process.env.APPIUM_PORT || 4723
        };

        if (isSauceLab) {
            const sauceUser = process.env.SAUCE_USER;
            const sauceKey = process.env.SAUCE_KEY;

            if (!sauceKey || !sauceUser) {
                throw new Error("Sauce Labs Username or Access Key is missing! Check environment variables for SAUCE_USER and SAUCE_KEY !!!");
            }

            config = "https://" + sauceUser + ":" + sauceKey + "@ondemand.saucelabs.com:443/wd/hub";
        }

        const driver = wd.promiseChainRemote(config);
        exports.configureLogging(driver);

        if (appLocation) {
            caps.app = isSauceLab ? "sauce-storage:" + appLocation : appLocation;
        } else if (!caps.app) {
            console.log("Getting caps.app!");
            caps.app = exports.getAppPath();
        }

        console.log("Creating driver!");
        return driver.init(caps);
    };

    exports.getAppPath = () => {
        console.log("testRunType " + testRunType);
        if (testRunType.includes("android")) {
            const apks = glob.sync("platforms/android/build/outputs/apk/*.apk").filter(function(file) { return file.indexOf("unaligned") < 0; });
            return apks[0];
        } else if (testRunType.includes("ios-simulator")) {
            const simulatorApps = glob.sync("platforms/ios/build/emulator/**/*.app");
            return simulatorApps[0];
        } else if (testRunType.includes("ios-device")) {
            const deviceApps = glob.sync("platforms/ios/build/device/**/*.ipa");
            return deviceApps[0];
        } else {
            throw new Error("No 'app' capability provided and incorrect 'runType' convention used: " + testRunType +
                ". In order to automatically search and locate app package please use 'android','ios-device','ios-simulator' in your 'runType' option. E.g --runType=android23, --runType=ios-simulator10iPhone6");
        }
    };

    exports.configureLogging = (driver) => {
        driver.on("status", function(info) {
            log(info.cyan);
        });
        driver.on("command", function(meth, path, data) {
            log(" > " + meth.yellow + path.grey + " " + (data || ""));
        });
        driver.on("http", function(meth, path, data) {
            log(" > " + meth.magenta + path + " " + (data || "").grey);
        });
    };

    exports.getElementsByXpath = (name) => {
        return "//" + elementFinder.getXPathElement(name, testRunType);
    };

    exports.getXPathByText = (text, exactMatch) => {
        return elementFinder.getXPathByText(text, exactMatch, testRunType);
    }

    function log(message) {
        if (process.env.VERBOSE_LOG) {
            console.log(message);
        }
    }