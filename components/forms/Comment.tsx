import { QuantitativeFormData, Pitreport } from "@/lib/Types";
export type CommentProps = {
  data: QuantitativeFormData | Pitreport;
  callback: (key: string, value: string) => void;
};

export function CommentBox(props: CommentProps) {
  const data = props.data instanceof QuantitativeFormData ? props.data : props.data.data;

  return (
    <div className="flex flex-col w-full h-1/2 items-center justify-center ">
      <h1 className="font-semibold mb-2">Comments:</h1>
      <textarea
        value={data?.comments}
        className="textarea textarea-primary w-full"
        placeholder="Say Something Important..."
        onChange={(e) => {
          props.callback("comments", e.target.value);
        }}
      ></textarea>
    </div>
  );
}
