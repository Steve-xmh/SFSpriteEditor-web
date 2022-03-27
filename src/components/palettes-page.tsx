import { FunctionComponent } from "preact";
import { FormattedMessage } from "react-intl";
import { useSelector } from "react-redux";
import {MainStore} from '../reducers';
import {getSprite} from '../reducers/sprite';
import { Color } from "../utils/color";
import styles from './palettes-page.module.css'

import arrowUpSvg from '../assets/arrow-up.svg'
import arrowDownSvg from '../assets/arrow-down.svg'
import removeSvg from '../assets/remove.svg'

export const Palette: FunctionComponent<{id:number}> = props => {
    const palette = useSelector<MainStore, Color[]>(state => getSprite(state).palettes[props.id]);
    return <div className={styles.palette}>
        {palette.map((color, i) => <div key={i} className={styles.paletteColor} style={{backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`}}></div>)}
        <div className={styles.spacer}></div>
        <button className={styles.paletteButton}><img src={arrowUpSvg} /></button>
        <button className={styles.paletteButton}><img src={arrowDownSvg} /></button>
        <button className={styles.paletteButton}><img src={removeSvg} /></button>
    </div>
}
export const PalettePage: FunctionComponent = props => {
    const palettes = useSelector<MainStore, Color[][]>(state => getSprite(state).palettes);
    return <div className={styles.palettesPage}>
        <button>
            <FormattedMessage id="palettes.toggle-color-mode" defaultMessage='Toggle color mode'/>
        </button>
        <button>
            <FormattedMessage id="palettes.new-palette" defaultMessage='New Palette'/>
        </button>
        {palettes.map((_color, i) => <Palette key={i} id={i}/>)}
    </div>
}