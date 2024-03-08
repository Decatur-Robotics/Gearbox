import { FormData } from "@/lib/Types";
export type CommentProps = {data: FormData, callback: (key: string, value: string) => void};

export function CommentBox(props: CommentProps) {
    return <div className="flex flex-col w-full h-1/2 items-center justify-center ">
                <h1>Comments</h1>
                <textarea value={props.data.Comment} className="textarea textarea-primary w-full" placeholder="Say Something..." onChange={(e) => {props.callback("Comment", e.target.value)}}>

                </textarea>
    </div>
}