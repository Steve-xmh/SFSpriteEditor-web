import { FunctionComponent } from "preact";
import { defineMessages, FormattedMessage } from "react-intl";
import { useSelector } from "react-redux";
import { getLastOpenError, getLoading } from "../reducers/files";
import { Dialog } from "./dialog";
import styles from "./loading-dialog.module.css";

const errorMessages = defineMessages({
    0: {
        id: 'error.read-error.unknown',
        defaultMessage: 'Unknown error: {error}',
    },
    1: {
        id: 'error.read-error.header-too-small',
        defaultMessage: 'Header too small with file size {fileSize}',
    },
    2: {
        id: 'error.read-error.tilesets-header-overflow',
        defaultMessage: 'Tilesets header position {address} overflowed with file size {fileSize}',
    },
    3: {
        id: 'error.read-error.palettes-header-overflow',
        defaultMessage: 'Palettes header position {address} overflowed with file size {fileSize}',
    },
    4: {
        id: 'error.read-error.sprites-header-overflow',
        defaultMessage: 'Sprites header position {address} overflowed with file size {fileSize}',
    },
    5: {
        id: 'error.read-error.animations-header-overflow',
        defaultMessage: 'Animations header position {address} overflowed with file size {fileSize}',
    },
    6: {
        id: 'error.read-error.palettes-address-overflow',
        defaultMessage: 'Palettes address overflowed with {address} and file size is {fileSize}',
    },
    7: {
        id: 'error.read-error.sprites-address-overflow',
        defaultMessage: 'Sprites address overflowed with {address} and file size is {fileSize}',
    },
    8: {
        id: 'error.read-error.tilesets-address-overflow',
        defaultMessage: 'Tilesets address overflowed with {address} and file size is {fileSize}',
    },
    9: {
        id: 'error.read-error.tilesets-eof',
        defaultMessage: 'Met end of file while reading tileset {tilesetId} at {address} and file size is {fileSize}',
    },
    10: {
        id: 'error.read-error.tilesets-wrong-position',
        defaultMessage: 'Tilesets at {address} is not at the expected position and file size is {fileSize}',
    },
    11: {
        id: 'error.read-error.tilesets-wrong-size',
        defaultMessage: 'Size of tilesets at {address} is incorrect ({size}) and file size is {fileSize}',
    },
    12: {
        id: 'error.read-error.unsupported-color-mode',
        defaultMessage: 'Unsupported color mode {colorDepth}',
    },
    13: {
        id: 'error.read-error.no-last-subsprite-mark',
        defaultMessage: 'Sprite {spriteId} has no last SubSprite mark',
    },
})

export const LoadingDialog: FunctionComponent = props => {
    const loading = useSelector(getLoading);
    const errors = useSelector(getLastOpenError);
    return <Dialog closable={!loading} dialogId="loading">
        {
            loading ? <>
                <FormattedMessage id="loading.loading-msg" defaultMessage='Loading' />
            </> :
            <div className={styles.errorPage}>
                <FormattedMessage id="loading.error-msg" defaultMessage="{amount, plural, =0 {No files} one {A file} two {Two files} other {{amount} files}} can't be opened, click other area to close and select opened file to go on" values={{ amount: errors.length }} />
                <div className={styles.errors}>
                    {
                        errors.map((error, i) =>
                            <div key={i}>
                                <div>{error.filename}</div>
                                <div>
                                    <FormattedMessage {...errorMessages[error.error.errorId]} values={{ ...error.error }} />
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        }
    </Dialog>
}