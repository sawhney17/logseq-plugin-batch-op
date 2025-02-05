import { Button, Input, Segmented } from "@/components/antd"
import { t } from "logseq-l10n"
import { useEffect, useRef, useState } from "preact/hooks"
import { useCompositionChange } from "reactutils"
import styles from "./index.css"

const { TextArea } = Input

export const SIMPLE = 1
export const ADVANCED = 2

export default function QueryInput({ onQuery }) {
  const [mode, setMode] = useState(SIMPLE)
  const [text, setText] = useState("")
  const textarea = useRef()

  useEffect(() => {
    logseq.on("ui:visible:changed", ({ visible }) => {
      if (visible) {
        setTimeout(() => textarea.current?.focus({ cursor: "start" }), 0)
      }
    })
    return () => {
      logseq.off("ui:visible:changed")
    }
  }, [])

  function onSwitchMode(value) {
    setMode(value)
    setText("")
  }

  function onKeyDown(e) {
    // cmd+enter or ctrl+enter
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      onQuery(mode, text)
    }
  }

  const textareaProps = useCompositionChange((e) => setText(e.target.value))

  return (
    <section class={styles.container}>
      <div class={styles.bar}>
        <Segmented
          options={[
            { label: t("Simple"), value: SIMPLE },
            { label: t("Advanced"), value: ADVANCED },
          ]}
          value={mode}
          onChange={onSwitchMode}
        />
        <div>
          <span class={styles.shortcut}>cmd/ctrl + enter</span>
          <Button
            type="primary"
            title="mod+enter"
            onClick={() => onQuery?.(mode, text)}
          >
            {t("Query")}
          </Button>
        </div>
      </div>
      <TextArea
        ref={textarea}
        placeholder={
          mode === SIMPLE
            ? t("Write down your query here. E.g:\n(and [[A]] [[B]])")
            : t(
                "Write down your advanced query here. E.g:\n[:find (pull ?b [*])\n :where\n [?b :block/marker _]]",
              )
        }
        value={text}
        {...textareaProps}
        onKeyDown={onKeyDown}
      />
    </section>
  )
}
