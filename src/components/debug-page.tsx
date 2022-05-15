import { FunctionComponent } from 'preact'
import { useState } from 'preact/hooks'

export const DebugPage: FunctionComponent = props => {
    // A text field
    const [text, setText] = useState('')
    return <>
        <h1>Debug Page</h1>
        <p>
            <label>
                Text:
                <input type="number" value={text} onInput={evt => setText(evt.currentTarget.value)} />
            </label>
        </p>
    </>
}
