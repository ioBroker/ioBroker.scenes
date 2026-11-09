/**
 * The styles of the shadow root. The element fills the box of the host, has a transparent background and inherits
 * `color` and `font`; the colors of a state come from the theme of the host (`--iob-success`, `--iob-warning`, ...),
 * so it looks right in light and dark. Sizes follow the box with container queries (`cqmin`), nothing is measured:
 * a square or tall box shows the symbol above the name, a wide one beside it.
 */
export const STYLES = `
:host {
    display: block;
    width: 100%;
    height: 100%;
}
.mount {
    width: 100%;
    height: 100%;
    /* the size of the box does not depend on what is in it */
    container-type: size;
}
.edit {
    pointer-events: none;
}
.scene {
    /* the color of an active scene: the setting, or the success color of the theme */
    --accent: var(--color, var(--iob-success));
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: clamp(6px, 8cqmin, 16px);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: clamp(2px, 4cqmin, 10px);
    overflow: hidden;
    border-radius: calc(var(--iob-border-radius) * 2);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    outline: none;
    transition: background-color 0.2s;
}
.scene.uncertain {
    --accent: var(--iob-warning);
}
.scene.clickable {
    cursor: pointer;
}
.scene.clickable:hover {
    background: color-mix(in srgb, currentColor 6%, transparent);
}
.scene.active {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
}
.scene.active.clickable:hover {
    background: color-mix(in srgb, var(--accent) 20%, transparent);
}
.scene.uncertain {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
}
.scene:focus-visible {
    box-shadow: inset 0 0 0 2px var(--iob-primary);
}
.scene.off {
    opacity: 0.5;
}
.symbol {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
.symbol svg,
.symbol img {
    width: clamp(20px, 36cqmin, 96px);
    height: clamp(20px, 36cqmin, 96px);
    display: block;
    flex: none;
}
.symbol svg {
    fill: var(--iob-text-secondary);
    opacity: 0.6;
}
.active .symbol svg,
.uncertain .symbol svg {
    fill: var(--accent);
    opacity: 1;
}
.uncertain .symbol svg {
    opacity: 0.8;
}
.symbol img {
    object-fit: contain;
    filter: grayscale(100%) opacity(0.5);
}
.active .symbol img {
    filter: none;
}
.uncertain .symbol img {
    filter: opacity(0.6);
}
.text {
    min-width: 0;
    flex: none;
}
.name,
.status {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.name {
    font-weight: 600;
    font-size: clamp(11px, 10cqmin, 20px);
    line-height: 1.3;
}
.status {
    color: var(--iob-text-secondary);
    font-size: clamp(9px, 7.5cqmin, 15px);
    line-height: 1.3;
    /* keeps its line while empty, so the name does not jump */
    min-height: 1.3em;
}
.uncertain .status {
    color: var(--iob-warning);
}
/* a wide box: the symbol beside the name */
@container (min-aspect-ratio: 9 / 5) {
    .scene {
        flex-direction: row;
        align-items: center;
        gap: clamp(6px, 10cqh, 16px);
        padding: clamp(4px, 10cqh, 16px) clamp(8px, 14cqh, 20px);
    }
    .symbol {
        flex: none;
    }
    .symbol svg,
    .symbol img {
        width: clamp(18px, 55cqh, 64px);
        height: clamp(18px, 55cqh, 64px);
    }
    .text {
        flex: 1;
    }
    .name {
        font-size: clamp(11px, 24cqh, 22px);
    }
    .status {
        font-size: clamp(9px, 17cqh, 15px);
    }
}
.hint {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(2px, 3cqmin, 8px);
    overflow: hidden;
    text-align: center;
    color: var(--iob-text-secondary);
    font-size: clamp(10px, 7cqmin, 15px);
}
.hint svg {
    width: clamp(16px, 14cqmin, 32px);
    height: clamp(16px, 14cqmin, 32px);
    fill: currentColor;
    flex: none;
}
`;
