import { FunctionComponent } from "preact";
import { useSelector } from "react-redux";
import {MainStore} from '../reducers';
import {getSprite} from '../reducers/sprite';
import { Color } from "../utils/color";
import styles from './palettes.module.css'

export const Palette: FunctionComponent<{id:number}> = props => {
    const palette = useSelector<MainStore, Color[]>(state => getSprite(state).palettes[props.id]);
    return <div className={styles.palettes}>
        {palette.map((color, i) => <div key={i} className={styles.palette} style={{backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})`}}></div>)}
    </div>
}
export const PaletteList: FunctionComponent = props => {
    const palettes = useSelector<MainStore, Color[][]>(state => getSprite(state).palettes);
    return <div className={styles.paletteList}>
        {palettes.map((_color, i) => <Palette key={i} id={i}/>)}
    </div>
}