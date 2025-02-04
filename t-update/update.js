const migrations = {
    "2": {
        "6": {
            "0": {
                "compatibility": ["2.6.0", "2.7.0"],
            }
        }
    }
}

const parseVersion = (version) => {
    const regex = /\d+/g;
    const matches = version.match(regex);

    if (matches) {
        const [major, minor, patch] = matches.map(Number);
        return { major, minor, patch };
    } else {
        return null;
    }
}

const loadModule = async (version, callback = (status = "error") => { }) => {
    return new Promise((resolve) => {
        try {
            import(`./v_${version}.js`).then(async (module) => {
                const status = await module.default(callback);
                resolve(status);
            }).catch(error => {
                resolve("error");
            });
        } catch (error) {
            resolve("error");
        }
    });
}

const getAppUpdates = () => {
    const key = "app-update";
    return JSON.parse(localStorage.getItem(key)) || {};
}

const setAppUpdate = (version) => {
    const key = "app-update";
    const appUpdates = getAppUpdates();
    appUpdates[version] = { complete: true };
    localStorage.setItem(key, JSON.stringify(appUpdates));
}

const isCompatible = (versionData, from, to) => {
    const fromVersion = parseVersion(from);
    const toVersion = parseVersion(to);

    // Проверка major версии
    if (versionData.major !== fromVersion.major || versionData.major !== toVersion.major) {
        return false;
    }

    // Проверка minor версии
    if (versionData.minor < fromVersion.minor || versionData.minor > toVersion.minor) {
        return false;
    }

    // Проверка patch версии
    if (versionData.minor === fromVersion.minor && versionData.patch < fromVersion.patch) {
        return false;
    }

    if (versionData.minor === toVersion.minor && versionData.patch > toVersion.patch) {
        return false;
    }

    return true;
}

const shouldSkipUpdate = (version, appUpdates, priority) => {
    return !priority && appUpdates[version] && appUpdates[version].complete;
}

export async function initialize({ version, callback, priority = false, onProgress = () => { } } = {}) {
    const versionData = parseVersion(version);
    const appUpdates = getAppUpdates();

    const majorMigrations = migrations[`${versionData.major}`];
    if (!majorMigrations) {
        console.error(`No migrations found for major version ${versionData.major}`);
        callback([]);
        return;
    }

    const tasks = [];

    let totalTasks = 0;

    Object.keys(majorMigrations).forEach(minor => {
        if (parseInt(minor) > versionData.minor) {
            return; // Пропускаем более новые minor версии
        }

        const minorMigrations = majorMigrations[minor];
        const versionKeys = Object.keys(minorMigrations);

        versionKeys.forEach(v => {
            const currentVersion = `${versionData.major}.${minor}.${v}`;

            if (priority && currentVersion !== version) {
                return;
            }

            if (shouldSkipUpdate(currentVersion, appUpdates, priority)) {
                tasks.push(async () => ({ version: currentVersion, status: "skipped" }));
                return;
            }

            const compatibility = minorMigrations[v].compatibility;
            if (compatibility && !isCompatible(versionData, ...compatibility)) {
                tasks.push(async () => ({ version: currentVersion, status: "skipped" }));
                return;
            }

            console.log(`[update] - Run: ${currentVersion}`);
            totalTasks++;
            tasks.push(() => loadModule(currentVersion).then(status => {
                if (status === "success") {
                    setAppUpdate(currentVersion);
                }
                return { version: currentVersion, status };
            }));
        });
    });

    let completedTasks = 0;
    const statuses = [];

    onProgress(totalTasks, completedTasks);

    for (const task of tasks) {
        const result = await task();
        statuses.push(result);

        if (result.status !== "skipped") {
            completedTasks++;
        }

        if (onProgress) {
            onProgress(totalTasks, completedTasks);
        }
    }

    callback(statuses);
}