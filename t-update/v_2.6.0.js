export default () => {
    try {
        const loadDbAnime = (key) => {
            return JSON.parse(localStorage.getItem(key)) || {};
        };

        const saveDbAnime = (key, value) => {
            localStorage.setItem(key, JSON.stringify(value));
        }

        const typeOf = (object) => {
            return Object.keys(object).toString();
        };

        const lKey = "anime-db"
        const synch = $PARAMETERS.anime.syncdata;
        const keys = Object.keys(localStorage);
        const dbAnime = loadDbAnime(lKey);

        const processUpdate = (value, key) => {
            const ldata = value;
            if (!dbAnime[key]) {
                dbAnime[key] = { synch, ldata };
            }
            localStorage.removeItem(key);
        };

        const passKey = ["anime-db", "access_token", "access_whoami", "anime-collection", "application_installed", "dialog-update", "github-version", "last-watch", "parametrs", "tunime-id"];
        const inclType = ['kodik_episode,kodik_dub,date_update', 'kodik_episode,kodik_dub'];

        keys.forEach(key => {
            if (passKey.includes(key))
                return;

            const value = loadDbAnime(key);

            if (!inclType.includes(typeOf(value)))
                return;

            processUpdate(value, key);
        });

        saveDbAnime(lKey, dbAnime);
        console.log(`[update] - Update data to ${lKey}`);
        return "success";
    } catch (error) {
        return "error";
    }
};