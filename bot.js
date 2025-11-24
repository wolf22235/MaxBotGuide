require('dotenv').config();
const { Bot, Keyboard } = require('@maxhub/max-bot-api');

const bot = new Bot(process.env.BOT_TOKEN);

// ====================== КАТЕГОРИИ ======================
const categories = {
    gastronomy: { title: 'Гастрономия Омска', places: ['Манилов — десерты и кофе (ул. Ленина, 2)', 'Зебра — сибирская кухня (набережная)', 'Колчак — загутай у реки (ул. Декабристов)', 'Сибирское подворье — медвежатина (ул. 5 Декабря)', 'Суши Бамбуши — роллы (ул. Маяковского, 101)', 'Лара — домашние торты (ул. Красный Путь)'], map: 'https://yandex.ru/maps/?text=кафе+рестораны+Омск&z=12' },
    sights: { title: 'Достопримечательности Омска', places: ['Омская крепость — XVIII век, музей', 'Успенский собор — золотые купола', 'Тарские ворота — вход в Сибирь', 'Любинский проспект — пешеходная зона', 'Музей Врубеля — шедевры искусства', 'Пожарная каланча — панорама города', 'Памятник Степанычу — омский юмор'], map: 'https://yandex.ru/maps/?text=достопримечательности+Омск&z=13' },
    parks: { title: 'Парки и природа', places: ['Парк 30-летия ВЛКСМ — аттракционы', 'Птичья гавань — экотропы', 'Парк Победы — мемориал', 'Зелёный остров — прогулки', 'Парк Вокруг света — канатные трассы'], map: 'https://yandex.ru/maps/?text=парки+Омск&z=12' },
    entertainment: { title: 'Развлечения', places: ['Театр драмы — классика', 'Кино «Космос» — IMAX', 'Квест «Побег» — 5 сценариев', 'Боулинг «Космос» — 12 дорожек', 'Театр Арлекин — куклы'], map: 'https://yandex.ru/maps/?text=театры+кино+квесты+Омск&z=12' },
    shopping: { title: 'Шопинг', places: ['ТЦ «Мега» — 120 магазинов', 'ТЦ «Континент» — одежда', 'ТЦ «Каскад» — электроника', 'Рынок «Левобережный» — продукты'], map: 'https://yandex.ru/maps/?text=ТЦ+рынки+Омск&z=12' },
    nightlife: { title: 'Ночная жизнь', places: ['Клуб «Ангар» — танцы до утра', 'Бар «Сибирь» — крафтовое пиво', 'Караоке «Голос» — 5000 песен', 'Клуб «Опера» — шоу-программа'], map: 'https://yandex.ru/maps/?text=бары+клубы+Омск&z=13' },
    kids: { title: 'Для детей', places: ['Омский зоопарк — шоу и тигры', 'Аквапарк «АкваРИО» — горки', 'Театр Арлекин — сказки', 'КидБург — профессии'], map: 'https://yandex.ru/maps/?text=зоопарк+аквапарк+дети+Омск&z=12' }
};

// ====================== КЛАВИАТУРА ======================
const mainMenu = Keyboard.inlineKeyboard([
    [Keyboard.button.callback('Гастрономия', 'cat_gastronomy'), Keyboard.button.callback('Достопримечательности', 'cat_sights')],
    [Keyboard.button.callback('Парки', 'cat_parks'), Keyboard.button.callback('Развлечения', 'cat_entertainment')],
    [Keyboard.button.callback('Шопинг', 'cat_shopping'), Keyboard.button.callback('Ночная жизнь', 'cat_nightlife')],
    [Keyboard.button.callback('Для детей', 'cat_kids')]
]);

const formatCategory = (cat) => {
    let text = `*${cat.title}*\n\nЗдесь вы найдёте:\n\n`;
    cat.places.forEach(p => text += `• ${p}\n`);
    text += `\n[Открыть все места на карте](${cat.map})`;
    return text;
};

const escapeMarkdown = (text) => text.replace(/([_*[\]()])/g, '\\$1');

// ====================== ПОМОЩНИК ДЛЯ ЛОГИРОВАНИЯ ======================
const getUserInfo = (ctx) => {
    const user = ctx.message?.body?.from || ctx.message?.from || ctx.from || {};
    const name = user.name || user.first_name || user.username || 'Неизвестно';
    const id = user.id || 'unknown';
    const chatId = ctx.message?.peer_id || ctx.peer_id || 'unknown';
    return { name, id, chatId };
};

// ====================== /START ======================
bot.command('start', async (ctx) => {
    const { name, id } = getUserInfo(ctx);
    console.log(`[${new Date().toISOString()}] /start от пользователя: ${name} (ID: ${id})`);
    
    await ctx.reply(
        `*Омск: Гид по городу*\n\nПривет! Я помогу найти лучшие места в нашем городе.\n\nВыберите категорию или просто напишите, что вас интересует — я покажу карту!`,
        { format: 'markdown', attachments: [mainMenu] }
    );
});

// ====================== CALLBACK — ОБРАБОТКА ПО BOT.ACTION (ПО ДОКУМЕНТАЦИИ) ======================
const map = {
    'cat_gastronomy': 'gastronomy',
    'cat_sights': 'sights',
    'cat_parks': 'parks',
    'cat_entertainment': 'entertainment',
    'cat_shopping': 'shopping',
    'cat_nightlife': 'nightlife',
    'cat_kids': 'kids'
};

// Обработка конкретных payload (по доке — bot.action)
Object.keys(map).forEach(payload => {
    bot.action(payload, async (ctx) => {
        const key = map[payload];
        const { name, id } = getUserInfo(ctx);
        console.log(`[${new Date().toISOString()}] КАТЕГОРИЯ ВЫБРАНА: "${categories[key].title}" | Пользователь: ${name} (ID: ${id})`);

        const newText = formatCategory(categories[key]);

        // 1. Подтверждение callback (по доке — raw.post с callback_query_id)
        const callbackId = ctx.callbackQuery?.id || ctx.message?.body?.callback_query_id;
        if (callbackId) {
            await ctx.api.raw.post('answerCallbackQuery', {
                callback_query_id: callbackId,
                text: '',  // Пустой текст — без алерта
                show_alert: false
            }).catch(() => {});  // Игнорируем ошибки подтверждения
        }

        // 2. Отправляем новое сообщение
        await ctx.reply(newText, {
            format: 'markdown',
            attachments: [mainMenu]
        });

        console.log(`[${new Date().toISOString()}] ОТВЕТ ОТПРАВЛЕН: "${categories[key].title}" → ${name} (ID: ${id})`);
    });
});

// ====================== ТЕКСТОВЫЕ СООБЩЕНИЯ ======================
bot.on('message_created', async (ctx) => {
    try {
        const text = ctx.message?.body?.text?.trim();
        if (!text) return;

        const { name, id } = getUserInfo(ctx);
        console.log(`[${new Date().toISOString()}] ТЕКСТ от ${name} (ID: ${id}): "${text}"`);

        const lower = text.toLowerCase();

        const synonyms = {
            'гастрономия': 'gastronomy', 'еда': 'gastronomy', 'кафе': 'gastronomy', 'рестораны': 'gastronomy', 'поесть': 'gastronomy', 'где поесть': 'gastronomy',
            'достопримечательности': 'sights', 'досты': 'sights', 'музей': 'sights', 'что посмотреть': 'sights',
            'парк': 'parks', 'парки': 'parks', 'природа': 'parks', 'погулять': 'parks',
            'развлечения': 'entertainment', 'кино': 'entertainment', 'театр': 'entertainment', 'квест': 'entertainment',
            'шопинг': 'shopping', 'шоп': 'shopping', 'магазины': 'shopping', 'тц': 'shopping',
            'ночная жизнь': 'nightlife', 'ночь': 'nightlife', 'клуб': 'nightlife', 'бар': 'nightlife',
            'дети': 'kids', 'ребенок': 'kids', 'зоопарк': 'kids', 'аквапарк': 'kids', 'акварио': 'kids'
        };

        let matchedKey = null;
        for (const [syn, cat] of Object.entries(synonyms)) {
            if (lower.includes(syn)) {
                matchedKey = cat;
                break;
            }
        }

        let replyText = '';
        if (matchedKey && categories[matchedKey]) {
            replyText = formatCategory(categories[matchedKey]);
            console.log(`[${new Date().toISOString()}] ТЕКСТ → КАТЕГОРИЯ: "${categories[matchedKey].title}" от ${name} (ID: ${id})`);
        } else {
            const escapedText = escapeMarkdown(text);
            const encoded = encodeURIComponent(text + ' Омск');
            const mapUrl = `https://yandex.ru/maps/?text=${encoded}&z=13`;
            replyText = `По запросу «${escapedText}» найдено в Омске:\n\n[Открыть в Яндекс.Картах](${mapUrl})\n\nВыберите категорию ниже`;
            console.log(`[${new Date().toISOString()}] УНИВЕРСАЛЬНЫЙ ПОИСК: "${text}" от ${name} (ID: ${id})`);
        }

        await ctx.reply(replyText, { format: 'markdown', attachments: [mainMenu] });

    } catch (err) {
        console.error(`[${new Date().toISOString()}] Ошибка в message_created:`, err);
    }
});

// ====================== ЛОВИМ ВСЕ ОШИБКИ ======================
bot.catch(err => console.error(`[${new Date().toISOString()}] Глобальная ошибка бота:`, err));

console.log(`\n[${new Date().toISOString()}] Омск: Гид по городу — запущен стабильно (по официальной доке)!\n`);
bot.start();