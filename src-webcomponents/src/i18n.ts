/** The words the element shows, in the languages of ioBroker */
const EN = {
    chooseScene: 'Choose a scene in the settings',
    notScene: 'Not a scene of the scenes adapter',
    scene: 'Scene',
    uncertain: 'uncertain',
    disabled: 'Disabled',
    activate: 'Activate',
    deactivate: 'Deactivate',
    confirmActivate: 'Are you sure you want to activate this scene?',
    confirmDeactivate: 'Are you sure you want to deactivate this scene?',
    pin: 'PIN',
    wrongPin: 'Wrong PIN',
};

export type WordKey = keyof typeof EN;

const WORDS: Record<string, Record<WordKey, string>> = {
    en: EN,
    de: {
        chooseScene: 'Szene in den Einstellungen wählen',
        notScene: 'Keine Szene des Szenen-Adapters',
        scene: 'Szene',
        uncertain: 'unbestimmt',
        disabled: 'Deaktiviert',
        activate: 'Aktivieren',
        deactivate: 'Deaktivieren',
        confirmActivate: 'Möchten Sie diese Szene wirklich aktivieren?',
        confirmDeactivate: 'Möchten Sie diese Szene wirklich deaktivieren?',
        pin: 'PIN',
        wrongPin: 'Falscher PIN',
    },
    ru: {
        chooseScene: 'Выберите сцену в настройках',
        notScene: 'Это не сцена адаптера scenes',
        scene: 'Сцена',
        uncertain: 'неопределенный',
        disabled: 'Отключена',
        activate: 'Активировать',
        deactivate: 'Деактивировать',
        confirmActivate: 'Вы действительно хотите активировать эту сцену?',
        confirmDeactivate: 'Вы действительно хотите деактивировать эту сцену?',
        pin: 'PIN-код',
        wrongPin: 'Неверный PIN-код',
    },
    pt: {
        chooseScene: 'Escolha uma cena nas configurações',
        notScene: 'Não é uma cena do adaptador scenes',
        scene: 'Cena',
        uncertain: 'incerto',
        disabled: 'Desativada',
        activate: 'Ativar',
        deactivate: 'Desativar',
        confirmActivate: 'Tem certeza de que deseja ativar esta cena?',
        confirmDeactivate: 'Tem certeza de que deseja desativar esta cena?',
        pin: 'PIN',
        wrongPin: 'PIN incorreto',
    },
    nl: {
        chooseScene: 'Kies een scène in de instellingen',
        notScene: 'Geen scène van de scenes-adapter',
        scene: 'Scène',
        uncertain: 'onzeker',
        disabled: 'Uitgeschakeld',
        activate: 'Activeren',
        deactivate: 'Deactiveren',
        confirmActivate: 'Weet u zeker dat u deze scène wilt activeren?',
        confirmDeactivate: 'Weet u zeker dat u deze scène wilt deactiveren?',
        pin: 'Pincode',
        wrongPin: 'Onjuiste pincode',
    },
    fr: {
        chooseScene: 'Choisissez une scène dans les paramètres',
        notScene: "Pas une scène de l'adaptateur scenes",
        scene: 'Scène',
        uncertain: 'incertain',
        disabled: 'Désactivée',
        activate: 'Activer',
        deactivate: 'Désactiver',
        confirmActivate: 'Voulez-vous vraiment activer cette scène ?',
        confirmDeactivate: 'Voulez-vous vraiment désactiver cette scène ?',
        pin: 'Code PIN',
        wrongPin: 'Code PIN incorrect',
    },
    it: {
        chooseScene: 'Scegli una scena nelle impostazioni',
        notScene: "Non è una scena dell'adattatore scenes",
        scene: 'Scena',
        uncertain: 'incerto',
        disabled: 'Disattivata',
        activate: 'Attiva',
        deactivate: 'Disattiva',
        confirmActivate: 'Vuoi davvero attivare questa scena?',
        confirmDeactivate: 'Vuoi davvero disattivare questa scena?',
        pin: 'PIN',
        wrongPin: 'PIN errato',
    },
    es: {
        chooseScene: 'Elija una escena en la configuración',
        notScene: 'No es una escena del adaptador scenes',
        scene: 'Escena',
        uncertain: 'incierto',
        disabled: 'Desactivada',
        activate: 'Activar',
        deactivate: 'Desactivar',
        confirmActivate: '¿Seguro que desea activar esta escena?',
        confirmDeactivate: '¿Seguro que desea desactivar esta escena?',
        pin: 'PIN',
        wrongPin: 'PIN incorrecto',
    },
    pl: {
        chooseScene: 'Wybierz scenę w ustawieniach',
        notScene: 'To nie jest scena adaptera scenes',
        scene: 'Scena',
        uncertain: 'niepewny',
        disabled: 'Wyłączona',
        activate: 'Aktywuj',
        deactivate: 'Dezaktywuj',
        confirmActivate: 'Czy na pewno chcesz aktywować tę scenę?',
        confirmDeactivate: 'Czy na pewno chcesz dezaktywować tę scenę?',
        pin: 'PIN',
        wrongPin: 'Nieprawidłowy PIN',
    },
    uk: {
        chooseScene: 'Виберіть сцену в налаштуваннях',
        notScene: 'Це не сцена адаптера scenes',
        scene: 'Сцена',
        uncertain: 'невизначений',
        disabled: 'Вимкнена',
        activate: 'Активувати',
        deactivate: 'Деактивувати',
        confirmActivate: 'Ви дійсно хочете активувати цю сцену?',
        confirmDeactivate: 'Ви дійсно хочете деактивувати цю сцену?',
        pin: 'PIN-код',
        wrongPin: 'Неправильний PIN-код',
    },
    'zh-cn': {
        chooseScene: '请在设置中选择场景',
        notScene: '不是 scenes 适配器的场景',
        scene: '场景',
        uncertain: '不确定',
        disabled: '已禁用',
        activate: '激活',
        deactivate: '停用',
        confirmActivate: '确定要激活此场景吗？',
        confirmDeactivate: '确定要停用此场景吗？',
        pin: 'PIN 码',
        wrongPin: 'PIN 码错误',
    },
};

/**
 * A word in the language of the system, English if there is none in it
 *
 * @param lang the language of the ioBroker system
 * @param key the word
 */
export function getWord(lang: string, key: WordKey): string {
    return WORDS[lang]?.[key] || EN[key];
}

/**
 * How long ago something happened, in words of the language: `5 minutes ago`, `vor 5 Minuten`
 *
 * @param lang the language of the ioBroker system
 * @param ts when it happened, in ms
 * @param now the current time, in ms
 */
export function formatAgo(lang: string, ts: number, now: number): string {
    const seconds = Math.max(0, Math.round((now - ts) / 1000));
    let format: Intl.RelativeTimeFormat;
    try {
        format = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    } catch {
        format = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    }
    if (seconds < 60) {
        return format.format(0, 'second');
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return format.format(-minutes, 'minute');
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return format.format(-hours, 'hour');
    }
    return format.format(-Math.floor(hours / 24), 'day');
}
