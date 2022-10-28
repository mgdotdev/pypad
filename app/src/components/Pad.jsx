import { createSignal, Index, onMount } from "solid-js"
import { createStore } from "solid-js/store"
import css from "./Pad.module.css"

import state from "../pages/state"


function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY
  };
}


function Pad() {
    const [listen, setListen] = createSignal(true)

    const [text, setText] = createStore(
        [
            {
                on: true,
                end: true,
                data: <></>,
                char: "",
            },
            {
                on: false,
                end: true,
                data: <>&nbsp;</>,
                char: "\n"
            },
        ]
    )

    state.text.get = () => text
    state.text.set = setText
    state.input.listen = setListen

    function insertText(char) {
        _localDumps(text)
        if (char.length > 1) {
            return special_char(char)
        }
        if (char == " ") {
            return _insertText(<>&nbsp;</>, char)
        }
        return _insertText(char, char)
    }

    function _insertText(data, char) {
        let idx = text.findIndex(item => item.on === true)
        setText(idx, 'on', false)
        setText(col => {
            let next = idx+1
            let head = col.slice(0, next)
            let tail = col.slice(next)
            let insert = {on: true, data: data, char: char}
            let res = [...head, insert, ...tail]
            return res
        })
    }

    function _localDumps(res) {
        let str = JSON.stringify(res.map(e=>e.char))
        localStorage.setItem("text", str)
        console.log(localStorage.getItem("text"))
    }

    function _loadString() {
        let arr = localStorage.getItem("text")
        if (!arr) return
        let str = JSON.parse(arr).slice(1, -2)

        for (let s of str) {
            switch (s) {
                case "\n":
                    _insertText(<br />, s)
                    break
                case "\t":
                    _insertText(<>&nbsp;&nbsp;&nbsp;&nbsp;</>, "\t")
                    break
                default:
                    _insertText(s, s)
            }
        }
    }


    function special_char(char) {
        switch (char) {
            case "Backspace":
                backspace_char()
                break
            case "Delete":
                delete_char()
                break
            case "Enter":
                _insertText(<br />, "\n")
                break
            case "ArrowLeft":
                move_cursor("left")
                break
            case "ArrowRight":
                move_cursor("right")
                break
            case "Tab":
                _insertText(<>&nbsp;&nbsp;&nbsp;&nbsp;</>, "\t")
                break
        }
    }

    function move_cursor(dir) {
        let idx = text.findIndex(item => item.on === true)
        if ((idx === 0 && dir === "left")||(idx === text.length - 2 && dir === "right")) {
            return
        }
        setText(idx, "on", false)
        switch (dir) {
            case "left":
                idx -= 1
                break
            case "right":
                idx += 1
                break
        }
        setText(idx, "on", true)
    }

    function delete_char() {
        let idx = text.findIndex(item => item.on === true)
        idx = idx + 1
        if (text[idx]?.end) {
            return
        }

        setText(col => {
            let head = col.slice(0, idx)
            let tail = idx >= col.length ? [] : col.slice(idx+1)
            return [...head, ...tail]
        })
    }

    function backspace_char() {
        let idx = text.findIndex(item => item.on === true)
        if (text[idx]?.end) {
            return
        }
        setText(col => {
            let head = col.slice(0, idx)
            let tail = idx >= col.length ? [] : col.slice(idx+1)
            return [...head, ...tail]
        })
        setText(idx - 1, 'on', true)
    }

    function setIndex(idx) {
        setText(item => item.on, 'on', false)
        setText(idx, 'on', true)
    }


    function updateIndex(index) {
        return function() {
            setIndex(index)
        }
    }

    let items = {}
    function updateCursor(event) {
        let index = 1
        for (let t of text) {
            let item = items[index]
            if (item) {
                if (t.on) {
                    item.style.boxShadow = "inset 0px 0px 1px 1px #E0E0E0"
                    let { top } = getOffset(item)
                    state.input.set(top)
                }
                else {
                    item.style.boxShadow = "inset 0 0 0 0 #E0E0E0"
                }
            }
            index += 1
        }
    }

    document.addEventListener("keydown", (event) => {
        if (event.ctrlKey || event.metaKey || !listen()) {
            return
        }

        if (event.key == "Tab") {
            event.preventDefault()
        }

        insertText(event.key)
    })

    document.addEventListener('keydown', updateCursor)
    document.addEventListener('click', updateCursor)

    onMount(_loadString)

    const bkg = () => {
        let config, user_config

        config = {
            "min-height": "100vh",
            "min-width": "100vw"
        }

        try {
            user_config = JSON.parse(state.config.pad())
        }
        catch {
            user_config = {}
        }

        return Object.assign(user_config, config)
    }

    const txt = () => {
        let config
        try {
            config = JSON.parse(state.config.text())
        }
        catch {
            config = {}
        }
        return config
    }

    return (
        <div class={css.Pad} style={bkg()}>
            <Index each={text}>
                {(item, index) => {
                    let ref
                    let res = (
                        <span ref={ref} style={txt()} onClick={updateIndex(index-1)}>{item().data}</span>
                    )
                    items[index] = ref
                    return res
            }}
            </Index>
        </div>
    )
}

export default Pad

