import { Button, Input, message, Popconfirm } from "@/components/antd"
import { ShellContext } from "@/libs/contexts"
import { t } from "logseq-l10n"
import { useCallback, useContext, useRef } from "preact/hooks"
import { debounce, produce } from "rambdax"
import { useStateRef } from "reactutils"
import styles from "./index.css"

export default function ReplaceContentPane() {
  const [patternText, setPatternText] = useStateRef("")
  const [replacementText, setReplacementText] = useStateRef("")
  const lastPattern = useRef("")
  const lastReplacement = useRef("")
  const buttonContainerRef = useRef()
  const { batchProcess, getNewestQueryResults, setQueryResults } =
    useContext(ShellContext)

  const previewReplace = useCallback(
    debounce(() => {
      const pattern = patternText.current
      const replacement = replacementText.current

      if (pattern !== lastPattern.current) {
        setQueryResults((data) =>
          produce(data, (draft) => {
            for (const block of draft) {
              // Only do replacements for blocks, not pages.
              if (block.page == null) continue

              if (!pattern) {
                if (block.searchMarkers != null) {
                  block.searchMarkers = undefined
                }
                continue
              }

              const patternLength = pattern.length
              const searchMarkers = []
              for (
                let i = 0, matchStart = 0;
                i < block.content.length;
                i = matchStart + patternLength
              ) {
                matchStart = block.content.indexOf(pattern, i)
                if (matchStart < 0) break
                searchMarkers.push([matchStart, matchStart + patternLength])
              }
              if (searchMarkers.length > 0) {
                block.searchMarkers = searchMarkers
              }
            }
          }),
        )
        lastPattern.current = pattern
      }
      if (replacement !== lastReplacement.current) {
        setQueryResults((data) =>
          produce(data, (draft) => {
            draft.searchReplacement = replacement
          }),
        )
        lastReplacement.current = replacement
      }
    }, 500),
    [],
  )

  const replaceContent = useCallback(
    async (data, pattern, replacement) => {
      if (!pattern) {
        message.error(t("What do you want to search?"))
        return
      }

      // Only do replacements for blocks, not pages.
      data = data.filter((block) => block.page != null)

      await Promise.all(
        data.map((block) => {
          const replaced = block.content.replaceAll(pattern, replacement ?? "")
          return logseq.Editor.updateBlock(block.uuid, replaced)
        }),
      )
      await getNewestQueryResults()
    },
    [getNewestQueryResults],
  )

  function replace() {
    batchProcess(replaceContent, patternText.current, replacementText.current)
    setPatternText("")
    setReplacementText("")
  }

  return (
    <div class={styles.container}>
      <div>{t("Search: ")}</div>
      <Input
        value={patternText.current}
        onChange={(e) => {
          setPatternText(e.target.value)
          previewReplace()
        }}
      />
      <div>{t("Replace: ")}</div>
      <Input
        value={replacementText.current}
        onChange={(e) => {
          setReplacementText(e.target.value)
          previewReplace()
        }}
      />
      <div ref={buttonContainerRef}>
        <Popconfirm
          getPopupContainer={() => buttonContainerRef.current}
          placement="bottom"
          title={t("Sure to make these replacements?")}
          okText={t("Yes")}
          cancelText={t("I'll reconsider")}
          onConfirm={replace}
        >
          <Button type="primary" block>
            {t("Replace")}
          </Button>
        </Popconfirm>
      </div>
    </div>
  )
}
