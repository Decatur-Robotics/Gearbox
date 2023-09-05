import { FormElement, FormElementType } from "@/lib/Types";

export default function PreviewElement(props: {data: FormElement, index: number, callback: (index: number, value: any)=>void}) {
    const data = props.data;
    const callback = props.callback;
    const index = props.index;
  
  
    const ref = data.ref;
    const text = data.text;
    const type = data.type;
    const value = data.value;
    console.log(data);
  
    function handleCallback(value: any) {
      if(callback) {
        callback(index, value);
      }
    }
  
    const FormElementTypeToForm = (type: FormElementType) => {
      if(type === FormElementType.Number) {
        return <div className="flex flex-row items-center justify-center space-x-8">
          <button className="btn btn-circle btn-info text-white" onClick={()=>handleCallback(value-1)}>-</button>
          <h1 className="font-bold text-4xl">{value}</h1>
          <button className="btn btn-circle btn-info text-white" onClick={()=>handleCallback(value+1)}>+</button>
        </div>
      }
  
      if(type === FormElementType.Text) {
        return <input type="text" className="input input-bordered" value={value} onChange={(e)=>handleCallback(e.target.value)}></input>
      }
  
      if(type === FormElementType.Boolean) {
        return <input type="checkbox" className="input input-bordered" checked={value} onClick={()=>handleCallback(!value)}></input>
      }
    }
  
    return <div className="card w-5/6 bg-base-200">
        <div className="card-body">
          <h1 className="card-title">{text}</h1>
          {FormElementTypeToForm(type)}
        </div>
      </div>
  }