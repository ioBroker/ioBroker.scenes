/**
 * The manifest of `<iob-scenes-scene>`. Read by the build only (`vite.config.ts`), which writes it as
 * `scenes-scene.json` next to the module - a host reads that file for its palette and its settings without loading
 * the module.
 *
 * The name and the description are those of the devices widget `ScenesWidget` (`common.deviceWidgets` in
 * io-package.json), read by the build: the same name, per language, makes vis-2 and devices offer the native widget
 * instead of this component, and every other host shows the component. The labels of the settings live here; the
 * dictionaries of the devices widget are not translated into every language.
 */
import type { WebComponentManifest, WebComponentText } from '@iobroker/web-components';

// with the extension: `vite.config.ts` imports this file, and Vite may load its config natively
import { MODULE_FILE, TAG } from './constants.ts';

export { MANIFEST_FILE, MODULE_FILE, MODULE_PATH, TAG } from './constants.ts';

/** The words of the devices widget, read by the build from `io-package.json` */
export interface ManifestTexts {
    /** `label` of the devices widget */
    name: WebComponentText;
    /** `description` of the devices widget */
    description: WebComponentText;
}

const SCENE: WebComponentText = {
    en: 'Scene',
    de: 'Szene',
    ru: 'Сцена',
    pt: 'Cena',
    nl: 'Scène',
    fr: 'Scène',
    it: 'Scena',
    es: 'Escena',
    pl: 'Scena',
    uk: 'Сцена',
    'zh-cn': '场景',
};

const SCENE_HELP: WebComponentText = {
    en: 'The state of the scene: scene.0.<name>',
    de: 'Der Datenpunkt der Szene: scene.0.<Name>',
    ru: 'Состояние сцены: scene.0.<имя>',
    pt: 'O estado da cena: scene.0.<nome>',
    nl: 'De status van de scène: scene.0.<naam>',
    fr: "L'état de la scène : scene.0.<nom>",
    it: 'Lo stato della scena: scene.0.<nome>',
    es: 'El estado de la escena: scene.0.<nombre>',
    pl: 'Stan sceny: scene.0.<nazwa>',
    uk: 'Стан сцени: scene.0.<назва>',
    'zh-cn': '场景的状态：scene.0.<名称>',
};

const NAME: WebComponentText = {
    en: 'Name',
    de: 'Name',
    ru: 'Название',
    pt: 'Nome',
    nl: 'Naam',
    fr: 'Nom',
    it: 'Nome',
    es: 'Nombre',
    pl: 'Nazwa',
    uk: 'Назва',
    'zh-cn': '名称',
};

const NAME_HELP: WebComponentText = {
    en: 'Instead of the name of the scene',
    de: 'Statt des Namens der Szene',
    ru: 'Вместо названия сцены',
    pt: 'Em vez do nome da cena',
    nl: 'In plaats van de naam van de scène',
    fr: 'À la place du nom de la scène',
    it: 'Al posto del nome della scena',
    es: 'En lugar del nombre de la escena',
    pl: 'Zamiast nazwy sceny',
    uk: 'Замість назви сцени',
    'zh-cn': '代替场景的名称',
};

const ICON: WebComponentText = {
    en: 'Icon',
    de: 'Icon',
    ru: 'Значок',
    pt: 'Ícone',
    nl: 'Pictogram',
    fr: 'Icône',
    it: 'Icona',
    es: 'Icono',
    pl: 'Ikona',
    uk: 'Значок',
    'zh-cn': '图标',
};

const ICON_HELP: WebComponentText = {
    en: 'URL of an image, e.g. /vis.0/main/img/scene.png; empty: the built-in symbol',
    de: 'URL eines Bildes, z. B. /vis.0/main/img/scene.png; leer: das eingebaute Symbol',
    ru: 'URL изображения, например /vis.0/main/img/scene.png; пусто: встроенный символ',
    pt: 'URL de uma imagem, p. ex. /vis.0/main/img/scene.png; vazio: o símbolo integrado',
    nl: 'URL van een afbeelding, bijv. /vis.0/main/img/scene.png; leeg: het ingebouwde symbool',
    fr: "URL d'une image, p. ex. /vis.0/main/img/scene.png ; vide : le symbole intégré",
    it: "URL di un'immagine, ad es. /vis.0/main/img/scene.png; vuoto: il simbolo integrato",
    es: 'URL de una imagen, p. ej. /vis.0/main/img/scene.png; vacío: el símbolo integrado',
    pl: 'URL obrazu, np. /vis.0/main/img/scene.png; puste: wbudowany symbol',
    uk: 'URL зображення, наприклад /vis.0/main/img/scene.png; порожньо: вбудований символ',
    'zh-cn': '图片的 URL，例如 /vis.0/main/img/scene.png；为空时使用内置符号',
};

const ICON_ACTIVE: WebComponentText = {
    en: 'Active icon',
    de: 'Aktives Icon',
    ru: 'Значок активной сцены',
    pt: 'Ícone ativo',
    nl: 'Actief pictogram',
    fr: 'Icône active',
    it: 'Icona attiva',
    es: 'Icono activo',
    pl: 'Ikona aktywna',
    uk: 'Значок активної сцени',
    'zh-cn': '激活时的图标',
};

const ICON_ACTIVE_HELP: WebComponentText = {
    en: 'While the scene is active; empty: the icon',
    de: 'Solange die Szene aktiv ist; leer: das Icon',
    ru: 'Пока сцена активна; пусто: обычный значок',
    pt: 'Enquanto a cena está ativa; vazio: o ícone',
    nl: 'Zolang de scène actief is; leeg: het pictogram',
    fr: "Tant que la scène est active ; vide : l'icône",
    it: "Finché la scena è attiva; vuoto: l'icona",
    es: 'Mientras la escena está activa; vacío: el icono',
    pl: 'Gdy scena jest aktywna; puste: ikona',
    uk: 'Поки сцена активна; порожньо: звичайний значок',
    'zh-cn': '场景激活时使用；为空时使用图标',
};

const COLOR: WebComponentText = {
    en: 'Color of the active scene',
    de: 'Farbe der aktiven Szene',
    ru: 'Цвет активной сцены',
    pt: 'Cor da cena ativa',
    nl: 'Kleur van de actieve scène',
    fr: 'Couleur de la scène active',
    it: 'Colore della scena attiva',
    es: 'Color de la escena activa',
    pl: 'Kolor aktywnej sceny',
    uk: 'Колір активної сцени',
    'zh-cn': '激活场景的颜色',
};

const COLOR_HELP: WebComponentText = {
    en: 'Empty: the success color of the theme',
    de: 'Leer: die Erfolgsfarbe des Themes',
    ru: 'Пусто: цвет успеха из темы',
    pt: 'Vazio: a cor de sucesso do tema',
    nl: 'Leeg: de succeskleur van het thema',
    fr: 'Vide : la couleur de succès du thème',
    it: 'Vuoto: il colore di successo del tema',
    es: 'Vacío: el color de éxito del tema',
    pl: 'Puste: kolor sukcesu motywu',
    uk: 'Порожньо: колір успіху з теми',
    'zh-cn': '为空时使用主题的成功色',
};

const CONFIRM: WebComponentText = {
    en: 'Confirmation',
    de: 'Bestätigung',
    ru: 'Подтверждение',
    pt: 'Confirmação',
    nl: 'Bevestiging',
    fr: 'Confirmation',
    it: 'Conferma',
    es: 'Confirmación',
    pl: 'Potwierdzenie',
    uk: 'Підтвердження',
    'zh-cn': '确认',
};

const CONFIRM_NONE: WebComponentText = {
    en: 'None',
    de: 'Keine',
    ru: 'Нет',
    pt: 'Nenhuma',
    nl: 'Geen',
    fr: 'Aucune',
    it: 'Nessuna',
    es: 'Ninguna',
    pl: 'Brak',
    uk: 'Немає',
    'zh-cn': '无',
};

const CONFIRM_DIALOG: WebComponentText = {
    en: 'Confirm dialog',
    de: 'Bestätigungsdialog',
    ru: 'Диалог подтверждения',
    pt: 'Diálogo de confirmação',
    nl: 'Bevestigingsdialoog',
    fr: 'Boîte de confirmation',
    it: 'Finestra di conferma',
    es: 'Diálogo de confirmación',
    pl: 'Okno potwierdzenia',
    uk: 'Діалог підтвердження',
    'zh-cn': '确认对话框',
};

const CONFIRM_PIN: WebComponentText = {
    en: 'PIN code',
    de: 'PIN-Code',
    ru: 'PIN-код',
    pt: 'Código PIN',
    nl: 'Pincode',
    fr: 'Code PIN',
    it: 'Codice PIN',
    es: 'Código PIN',
    pl: 'Kod PIN',
    uk: 'PIN-код',
    'zh-cn': 'PIN 码',
};

const CONFIRM_TEXT: WebComponentText = {
    en: 'Confirmation text',
    de: 'Bestätigungstext',
    ru: 'Текст подтверждения',
    pt: 'Texto de confirmação',
    nl: 'Bevestigingstekst',
    fr: 'Texte de confirmation',
    it: 'Testo di conferma',
    es: 'Texto de confirmación',
    pl: 'Tekst potwierdzenia',
    uk: 'Текст підтвердження',
    'zh-cn': '确认文本',
};

const CONFIRM_TEXT_HELP: WebComponentText = {
    en: 'Empty: the standard question',
    de: 'Leer: die Standardfrage',
    ru: 'Пусто: стандартный вопрос',
    pt: 'Vazio: a pergunta padrão',
    nl: 'Leeg: de standaardvraag',
    fr: 'Vide : la question standard',
    it: 'Vuoto: la domanda standard',
    es: 'Vacío: la pregunta estándar',
    pl: 'Puste: standardowe pytanie',
    uk: 'Порожньо: стандартне питання',
    'zh-cn': '为空时使用默认问题',
};

const PIN: WebComponentText = {
    en: 'PIN',
    de: 'PIN',
    ru: 'PIN-код',
    pt: 'PIN',
    nl: 'Pincode',
    fr: 'Code PIN',
    it: 'PIN',
    es: 'PIN',
    pl: 'PIN',
    uk: 'PIN-код',
    'zh-cn': 'PIN 码',
};

/**
 * The manifest, with the name and the description of the devices widget
 *
 * @param texts the words read from `io-package.json`
 */
export function buildManifest(texts: ManifestTexts): WebComponentManifest {
    return {
        $schema: 'https://raw.githubusercontent.com/ioBroker/web-components/main/schemas/manifest.json',
        manifestVersion: 1,
        tag: TAG,
        name: texts.name,
        description: texts.description,
        // relative to this file: /adapter/scenes/scenes.png
        icon: '../scenes.png',
        module: MODULE_FILE,
        // a tile of a dashboard, like one cell of devices
        size: { width: 160, height: 160 },
        settings: {
            type: 'panel',
            items: {
                scene: {
                    type: 'objectId',
                    types: 'state',
                    // every instance of the adapter; the scenes are below scene.<instance>
                    root: 'scene',
                    label: SCENE,
                    help: SCENE_HELP,
                },
                name: { type: 'text', label: NAME, help: NAME_HELP },
                icon: { type: 'text', label: ICON, help: ICON_HELP },
                iconActive: { type: 'text', label: ICON_ACTIVE, help: ICON_ACTIVE_HELP },
                color: { type: 'color', label: COLOR, help: COLOR_HELP },
                confirm: {
                    type: 'select',
                    label: CONFIRM,
                    default: 'none',
                    options: [
                        { value: 'none', label: CONFIRM_NONE },
                        { value: 'dialog', label: CONFIRM_DIALOG },
                        { value: 'pin', label: CONFIRM_PIN },
                    ],
                },
                confirmText: {
                    type: 'text',
                    label: CONFIRM_TEXT,
                    help: CONFIRM_TEXT_HELP,
                    hidden: "!data.confirm || data.confirm === 'none'",
                },
                pin: {
                    type: 'password',
                    label: PIN,
                    hidden: "data.confirm !== 'pin'",
                },
            },
        },
    };
}
