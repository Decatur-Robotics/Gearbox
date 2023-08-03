import UrlResolver, { ResolvedUrlData } from "@/lib/UrlResolver";
import { useEffect, useState } from "react";
import { Form, FormElement, FormElementType } from "@/lib/Types";
import { GetServerSideProps } from "next";
import ClientAPI from "@/lib/client/ClientAPI";
import { useRouter } from 'next/router'

const api = new ClientAPI();

const defaultElement : FormElement = {
  ref: "untitled_question",
  text: "Untitled Question",
  type: FormElementType.Number,
  value: 0,
}

function FormElementTypeToInputType(type: FormElementType): string {
  switch (type) {
    case FormElementType.Number:
      return "number"
    case FormElementType.Text:
      return "text"
    case FormElementType.Boolean:
      return "checkbox"
  }
};

function EditElement(props: {data: FormElement, index: number, callback: (index: number, key: string, value: any)=>void}) {
    const data = props.data;
    const index = props.index;
    const change = props.callback;

    const ref = data.ref;
    const text = data.text;
    const type = data.type;
    const value = data.value;


    return <div className="card w-5/6 bg-base-200">
        <div className="card-body">
          
        <p className="text-lg font-semibold inline">Question Prompt: </p>
          <input type="text" placeholder="Prompt" onChange={(e)=>change(index, "text", e.target.value)} value={text} className="input input-bordered"></input>
          <p className="italic text-sm">Reference: {ref}</p>

          <p className="text-lg font-semibold inline">Question Type: </p>
          <select value={type} onChange={(e)=>change(index, "type", e.target.value)} className="select select-bordered">
            {
              Object.keys(FormElementType).map((type) => <option value={type}>{type}</option>)
            }
          </select>

          <p className="text-lg font-semibold inline">Value: </p>

          <input value={value} onChange={(e)=>change(index, "value", e.target.value)} type={FormElementTypeToInputType(type)} className="input input-bordered"></input>
       </div>
    </div>
}

function PreviewElement(props: {data: FormElement, index: number}) {
  const data = props.data;
  const index = props.index;


  const ref = data.ref;
  const text = data.text;
  const type = data.type;
  const value = data.value;


  const FormElementTypeToForm = (type: FormElementType) => {
    if(type === FormElementType.Number) {
      return <div className="flex flex-row items-center justify-center space-x-8">
        <button className="btn btn-circle btn-info text-white">-</button>
        <h1 className="font-bold text-4xl">{value}</h1>
        <button className="btn btn-circle btn-info text-white">+</button>
      </div>
    }

    if(type === FormElementType.Text) {
      return <input type="text" className="input input-bordered" placeholder={value}></input>
    }

    if(type === FormElementType.Boolean) {
      return <input type="checkbox" className="input input-bordered" placeholder={value}></input>
    }
  }

  return <div className="card bg-base-200">
      <div className="card-body">
        <h1 className="card-title">{text}</h1>
        {FormElementTypeToForm(type)}
      </div>
    </div>
}

export default function Home(props: ResolvedUrlData) {
  const season = props.season;

  const router = useRouter()
  // if form has prexisitng form id
  const {id} = router.query;

  const[name, setName] = useState("New Form");
  const[formId, setFormId] = useState<string | undefined>();
  const[saveStatus, setSaveStatus] = useState("Saved")

  const[elements, setElements] = useState<FormElement[]>([defaultElement]);

  useEffect(() => {
    const getForm = async () => {
      setFormId((await api.findFormById(id as string))._id)
    }

    if(id) {
      getForm();
    }
  }, [])

  const editElementData = (index: number, key: string, value: any) => {
    var copy = structuredClone(elements) as FormElement[];
    //@ts-ignore 
    copy[index][key] = value;

    if(key === "text") {
      const ref = value.toLowerCase().replace(/\s{2,}/g, '_').trim().replaceAll(" ", "_");
      copy[index]["ref"] = ref;
    }

    if(key === "type") {
      copy[index]["value"] = undefined;
    }

    setElements(copy);
  }

  const addElement = () => {
    var copy = structuredClone(elements);
    copy.push(defaultElement)
    setElements(copy)
  }

  // make sure to load from url id thing
  const saveForm = async() => {
    setSaveStatus("Saving...");

    if(formId) {
      setFormId((await api.createForm(name, elements, season?._id))._id);
    } else {
      await api.updateForm({name: name, data: elements}, formId);
    }

    setSaveStatus("Saved")
  }
  

  useEffect(() => {
    saveForm()
  }, [name, elements]);

  return <div className="ml-10 flex flex-col w-5/6">
      <h1 className="text-4xl card-title mb-2">Form Editor</h1>
      <input type="text" placeholder="Form Name" value={name} onChange={(e) =>{setName(e.target.value)}} className="input input-bordered w-full max-w-xs" />
      <div className="divider"></div>

      <div className="flex flex-row">

        <div className="w-1/2">
          <div className="w-full flex flex-col space-y-2">
          <h1 className="text-2xl">Edit Form</h1>
          {
            elements.map((element, index) => <EditElement data={element} key={index} index={index} callback={editElementData}></EditElement>)
          }
          <button className="btn btn-info text-3xl text-white" onClick={addElement}>Add</button>
          </div>
        </div>
        <div className="divider divider-horizontal"></div>
        <div className="w-1/2 flex flex-col space-y-2">
          <h1 className="text-2xl">Preview Form</h1>
          {
            elements.map((element, index) => <PreviewElement data={element} key={index} index={index} ></PreviewElement>)
          }
        </div>
      </div>
  </div>

}

export const getServerSideProps: GetServerSideProps = async ({req, res, resolvedUrl}) => {
  return {
    props: await UrlResolver(resolvedUrl),
  }
}