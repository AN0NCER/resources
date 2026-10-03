export default () => {
    return new Promise(async (resolve) => {
        const STORAGE_NAME = "anime-collection";

        const FALLBACK = "Коллекция";

        const SKIP = ["favourites"];

        const load = () => {
            try {
                const raw = JSON.parse(localStorage.getItem(STORAGE_NAME));
                return Array.isArray(raw) ? raw : null;
            } catch (err) {
                console.log('[migrate] - Битый список коллекций', err);
                return null;
            }
        };

        const save = (list) => {
            if (list.length === 0) return localStorage.removeItem(STORAGE_NAME);
            localStorage.setItem(STORAGE_NAME, JSON.stringify(list));
        };

        try {
            if (!localStorage.getItem(STORAGE_NAME)) return resolve("success");

            // Коллекции создаются от имени пользователя: без входа запрос
            // ушёл бы в очередь, а ключ уже был бы стёрт
            const { OAuth } = await import('https://an0ncer.github.io/javascript/core/main.core.js');
            if (!OAuth.auth) return resolve("skip");

            const list = load();

            // Разобрать не вышло — оставляем как есть: лучше мусор
            // в хранилище, чем потерянные коллекции
            if (!list) return resolve("error");

            const { Collections } = await import('https://an0ncer.github.io/javascript/modules/tun.collections.js');

            /** Что не доехало — остаётся до следующего запуска */
            const rest = [];

            for (let i = 0; i < list.length; i++) {
                const collection = list[i];

                if (!SKIP.includes(collection?.id)) {
                    try {
                        const created = await Collections.create(collection?.name || FALLBACK, {
                            anime: collection?.list ?? []
                        });

                        if (!created) throw new Error('CREATE_FAILED');
                    } catch (err) {
                        console.log('[migrate] - Не удалось перенести коллекцию', collection, err);
                        rest.push(collection);
                    }
                }

                // Пишем после каждой: обрыв на середине не заставит
                // переносить заново то, что уже уехало
                save([...rest, ...list.slice(i + 1)]);
            }

            console.log(`[migrate] - Перенесено коллекций: ${list.length - rest.length}`);
            resolve("success");
        } catch (err) {
            console.log('[migrate] - Миграция коллекций не выполнена', err);
            resolve("error");
        }
    });
};