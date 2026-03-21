import { useEditor, EditorContent, Editor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { compressImage } from '@/utils/imageCompression'
import {
    Bold, Italic, Strikethrough, Heading1, Heading2,
    List, ListOrdered, Quote, ImageIcon, Undo, Redo, Loader2
} from 'lucide-react'

interface NoticeEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const MenuBar = ({ editor, onImageUpload, isUploading }: { editor: Editor | null, onImageUpload: () => void, isUploading: boolean }) => {
    if (!editor) {
        return null
    }

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded-t-md">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ${editor.isActive('bold') ? 'bg-zinc-200 dark:bg-zinc-800 font-bold' : ''}`}
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ${editor.isActive('italic') ? 'bg-zinc-200 dark:bg-zinc-800 font-bold' : ''}`}
            >
                <Italic className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ${editor.isActive('strike') ? 'bg-zinc-200 dark:bg-zinc-800 font-bold' : ''}`}
            >
                <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ${editor.isActive('heading', { level: 1 }) ? 'bg-zinc-200 dark:bg-zinc-800 font-bold' : ''}`}
            >
                <Heading1 className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ${editor.isActive('heading', { level: 2 }) ? 'bg-zinc-200 dark:bg-zinc-800 font-bold' : ''}`}
            >
                <Heading2 className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ${editor.isActive('bulletList') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}
            >
                <List className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ${editor.isActive('orderedList') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}
            >
                <ListOrdered className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ${editor.isActive('blockquote') ? 'bg-zinc-200 dark:bg-zinc-800' : ''}`}
            >
                <Quote className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

            <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
                <Undo className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
                <Redo className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

            <button
                type="button"
                onClick={onImageUpload}
                disabled={isUploading}
                className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1 ml-auto"
                title="사진 삽입"
            >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <ImageIcon className="w-4 h-4 text-emerald-500" />}
                <span className="text-sm font-medium ml-1">사진 넣기</span>
            </button>
        </div>
    )
}

export default function NoticeEditor({ content, onChange }: NoticeEditorProps) {
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isUploading, setIsUploading] = useState(false)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[300px] p-4 max-w-none prose-p:my-1 prose-li:my-0.5',
            },
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        handleImageFile(file);
                        return true;
                    }
                }
                return false;
            },
        },
    })

    const handleImageFile = async (file: File) => {
        if (!editor || isUploading) return;

        // Check image count limit
        const currentHtml = editor.getHTML();
        const imageCount = (currentHtml.match(/<img /g) || []).length;
        if (imageCount >= 3) {
            alert('사진은 최대 3장까지만 첨부할 수 있습니다.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        try {
            // 1. Compress Image
            const compressedFile = await compressImage(file, 1, 1024);

            // 2. Upload to Supabase
            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('notices')
                .upload(filePath, compressedFile);

            if (uploadError) {
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            // 3. Get Public URL
            const { data } = supabase.storage
                .from('notices')
                .getPublicUrl(filePath);

            // 4. Insert image into editor
            const imageUrl = data.publicUrl;
            editor.chain().focus().setImage({ src: imageUrl }).run();

        } catch (error) {
            console.error('Error handling image upload:', error);
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleImageFile(e.target.files[0]);
        }
    }

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-900 dark:bg-zinc-950">
            <MenuBar editor={editor} onImageUpload={() => fileInputRef.current?.click()} isUploading={isUploading} />
            <div className="cursor-text">
                <EditorContent editor={editor} />
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    )
}
