class TypeAnime {
    static Typeof(data) {
        return Object.keys(data).toString();
    }
}

(() => {
    const synch = $PARAMETERS.anime.syncdata;
    const keys = Object.keys(localStorage);
    const dbAnime = JSON.parse(localStorage.getItem("anime-db")) || {};
    keys.forEach(key => {
        if (key === "anime-db")
            return;
        const value = localStorage.getItem(key);
        if (value.includes('kodik_episode') && value.includes('kodik_dub')) {
            const data = JSON.parse(value);
            const type = TypeAnime.Typeof(data);

            if (!['kodik_episode,kodik_dub,date_update', 'kodik_episode,kodik_dub'].includes(type))
                return;

            const ldata = data;
            if(!dbAnime[key]){
                dbAnime[key] = {synch, ldata}
            }
            localStorage.removeItem(key);
        }
    });
    localStorage.setItem('anime-db', JSON.stringify(dbAnime));
})();