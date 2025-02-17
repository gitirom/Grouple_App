"use client"

import { cn } from '@/lib/utils'
import { CharacterCount, EditorContent, EditorRoot, handleCommandNavigation, JSONContent, Placeholder } from 'novel'
import React, { useState } from 'react'
import { FieldErrors } from 'react-hook-form'
import { HtmlParser } from '../html-parser'
import { defaultExtensions } from './extensions'
import { slashCommand } from './slash-command'

type Props = {
    content: JSONContent | undefined
    setContent: React.Dispatch<React.SetStateAction<JSONContent | undefined>>
    min: number
    max: number
    name: string
    errors: FieldErrors
    textContent: string | undefined
    setTextContent: React.Dispatch<React.SetStateAction<string | undefined>>
    onEdit?: boolean
    inline?: boolean
    disabled?: boolean
    htmlContent?: string | undefined
    setHtmlContent?: React.Dispatch<React.SetStateAction<string | undefined>>
}

const BlockTextEditor = ({
    content,
    setContent,
    min,
    max,
    name,
    errors,
    textContent,
    setTextContent,
    onEdit,
    inline,
    disabled,
    htmlContent,
    setHtmlContent,
}: Props) => {

    const [openNode, setOpenNode] = useState<boolean>(false);
    const [openLink, setOpenLink] = useState<boolean>(false);
    const [openColor, setOpenColor] = useState<boolean>(false);
    const [characters, setCharacters] = useState<number | undefined >(
        textContent?.length || undefined
    );

    return (
        <div>
            {" "}
            {htmlContent && !onEdit && inline ? (
                <HtmlParser html={htmlContent} />  //If htmlContent exists and onEdit is false, the editor is disabled, and the HTML content is rendered using the HtmlParser component.
            ) : (
                <EditorRoot>  {/*create the text editor, with the EditorContent responsible for rendering the editable content.*/}
                    <EditorContent
                        className={cn(
                            inline ? onEdit && "mb-5"
                            : "border-[1px] rounded-xl px-10 py-5 text-base border-themeGray bg-themeBlack w-full"
                        )}
                        initialContent={content}
                        editorProps={{
                            editable: () => !disabled as boolean,
                            handleDOMEvents: {
                                keydown: (_view, event) => handleCommandNavigation(event),
                            },
                            attributes: {
                                class: `prose prose-lg dark:prose-invert focus:outline-none max-w-full [&_h1]:text-4xl [&_h2]:text-3xl [&_h3]:text-2xl text-themeTextGray`,
                            },
                        }}
                        //configure the editor with several extensions:
                        extensions={[
                            // @ts-ignore
                            ...defaultExtensions,
                            // @ts-ignore
                            slashCommand,
                            // @ts-ignore
                            CharacterCount.configure({
                                limit: max,
                            }),
                            // @ts-ignore
                            Placeholder.configure({
                                placeholder: "Type / to insert element...",
                            }),
                            // @ts-ignore
                            Video,
                            // @ts-ignore
                            Image,
                        ]}
                        onUpdate={({ editor }) => {
                            const json = editor.getJSON()
                            const text = editor.getText()
                            
                            if (setHtmlContent) {
                                const html = editor.getHTML()
                                setHtmlContent(html)
                            }
                            setContent(json)
                            setTextContent(text)
                            setCharacters(text.length)
                        }}
                    >

                    </EditorContent>
                </EditorRoot>
            )}
        </div>
    )
}

export default BlockTextEditor