import { useState, type CSSProperties, type JSX, type KeyboardEvent } from 'react';

import type { SceneActivity } from './constants';

/** The symbols of Material Design the devices widget shows: a clapperboard, and a play arrow when active */
const MOVIE_PATH =
    'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z';
const PLAY_PATH = 'M8 5v14l11-7z';

function SvgIcon({ path }: { path: string }): JSX.Element {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d={path} />
        </svg>
    );
}

/** An image of the settings, or the symbol if there is none or it cannot be loaded */
function Picture({ src, active }: { src: string; active: boolean }): JSX.Element {
    const [failed, setFailed] = useState('');
    if (src && failed !== src) {
        return (
            <img
                src={src}
                alt=""
                draggable={false}
                onError={() => setFailed(src)}
            />
        );
    }
    return <SvgIcon path={active ? PLAY_PATH : MOVIE_PATH} />;
}

export interface SceneViewProps {
    name: string;
    activity: SceneActivity;
    /** Below the name: since when the scene is active, `uncertain`, the value of a virtual group, ... */
    status: string;
    /** The image of the settings for this activity, empty for the symbol */
    image: string;
    /** The color of an active scene, empty for the one of the theme */
    color: string;
    /** The scene is disabled in the adapter: shown dimmed, a click does nothing */
    off: boolean;
    /** What a click does, for the tooltip and the screen reader */
    action: string;
    editMode: boolean;
    onClick: () => void;
}

/**
 * The scene as a tile: the symbol, the name and below it the status; a click activates the scene - or deactivates
 * an active one that has "set on false"
 */
export function SceneView(props: SceneViewProps): JSX.Element {
    const { name, activity, status, image, color, off, action, editMode, onClick } = props;
    const clickable = !off && !editMode;
    const classes = ['scene'];
    if (activity === true) {
        classes.push('active');
    } else if (activity === 'uncertain') {
        classes.push('uncertain');
    }
    if (clickable) {
        classes.push('clickable');
    }
    if (off) {
        classes.push('off');
    }
    if (editMode) {
        classes.push('edit');
    }

    return (
        <div
            className={classes.join(' ')}
            style={color ? ({ '--color': color } as CSSProperties) : undefined}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            title={clickable ? `${name}: ${action}` : undefined}
            aria-label={clickable ? `${name}: ${action}` : undefined}
            onClick={clickable ? onClick : undefined}
            onKeyDown={
                clickable
                    ? (e: KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick();
                          }
                      }
                    : undefined
            }
        >
            <div className="symbol">
                <Picture
                    src={image}
                    active={activity === true || activity === 'uncertain'}
                />
            </div>
            <div className="text">
                <div className="name">{name}</div>
                <div className="status">{status}</div>
            </div>
        </div>
    );
}

/**
 * A hint instead of the scene: no scene chosen, or the ID is not one
 *
 * @param props the text and whether the host is in edit mode
 * @param props.text what to say
 * @param props.editMode in edit mode the element takes no clicks
 */
export function Hint({ text, editMode }: { text: string; editMode: boolean }): JSX.Element {
    return (
        <div className={`hint${editMode ? ' edit' : ''}`}>
            <SvgIcon path={MOVIE_PATH} />
            <span>{text}</span>
        </div>
    );
}
