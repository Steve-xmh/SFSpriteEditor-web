import { FunctionComponent } from 'preact'
import { FormattedMessage } from 'react-intl'
import { useSelector, useDispatch } from 'react-redux'
import { MainStore } from '../reducers'
import { getSprite, setSprite } from '../reducers/sprite'
import { Color } from '../utils/color'
import styles from './palettes-page.module.css'

import arrowUpSvg from '../assets/arrow-up.svg'
import arrowDownSvg from '../assets/arrow-down.svg'
import removeSvg from '../assets/remove.svg'
import { useCallback } from 'preact/hooks'

export const Palette: FunctionComponent<{ id: number }> = props => {
    const sprite = useSelector(getSprite)
    const palette = sprite.palettes[props.id]
    const dispatch = useDispatch()

    const onCopyPalette = async () => {
        await navigator.clipboard.writeText('PALETTE' + JSON.stringify(palette))
    }

    const onPasteReplacePalette = async () => {
        const text = await navigator.clipboard.readText()
        if (text.startsWith('PALETTE')) {
            const palette = JSON.parse(text.slice(7))
            if (palette instanceof Array && palette.length === sprite.palettes[props.id].length) {
                const palettes = sprite.palettes.slice()
                palettes[props.id] = palette
                dispatch(setSprite({ palettes }))
            }
        }
    }

    return <div className={styles.palette}>
        {palette.map((color, i) => <div key={i} className={styles.paletteColor} style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}></div>)}
        <div className={styles.spacer}></div>
        <button className={styles.paletteButton}><img src={arrowUpSvg} onClick={onCopyPalette} /></button>
        <button className={styles.paletteButton}><img src={arrowDownSvg} onClick={onPasteReplacePalette} /></button>
        <button className={styles.paletteButton}><img src={removeSvg} /></button>
    </div>
}
export const PalettePage: FunctionComponent = props => {
    const palettes = useSelector<MainStore, Color[][]>(state => getSprite(state).palettes)

    return <div className={styles.palettesPage}>
        <button>
            <FormattedMessage id="palettes.toggle-color-mode" defaultMessage='Toggle color mode' />
        </button>
        <button>
            <FormattedMessage id="palettes.new-palette" defaultMessage='New Palette' />
        </button>
        {palettes.map((_color, i) => <Palette key={i} id={i} />)}
    </div>
}
