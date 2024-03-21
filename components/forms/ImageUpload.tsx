import { Pitreport } from "@/lib/Types";
import imageCompression from "browser-image-compression";
import React, { useState } from "react";
import { FaFileUpload, FaImage } from "react-icons/fa";

const DefaultCompressionOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export default function ImageUpload(props: {
  data: Pitreport;
  callback: (key: string, value: string | number | boolean) => void;
}) {
  const [imageUrl, setImageUrl] = useState(
    props.data.image !== "/robot.jpg" ? props.data.image : ""
  );
  const [uploadProgress, setUploadProgress] = useState(-1);

  const onUpload = async (event: any) => {
    setUploadProgress(50);
    const data = event.target.files[0];
    console.log(`originalFile size ${data.size / 1024 / 1024} MB`);

    const compressionOptions = {
      ...DefaultCompressionOptions,
      fileType: (data.name as string).split(".").at(-1)
    }

    const compressedFile = await imageCompression(data, compressionOptions);
    console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`);

    const formData = new FormData();
    formData.append("files", compressedFile);

    const res = await fetch("/api/img/upload", {
      method: "POST",
      headers: {
        "gearbox-auth": "gearboxiscool",
      },
      body: formData,
    });

    if (res.status === 200) {
      const data = await res.json();
      const url = `/api/img/${data.filename}`;

      setTimeout(() => {
        setImageUrl(url);
        props.callback("image", url);
        setUploadProgress(100);
      }, 1000);
    } else {
      setUploadProgress(-1);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {!imageUrl ? (
        <div className="flex flex-col justify-center items-center w-64 h-64 animate-pulse bg-slate-600 opacity-25 rounded-lg">
          <FaImage size={60}></FaImage>
          Upload an Image first
        </div>
      ) : (
        <img src={imageUrl} className="w-64 h-64 rounded-lg"></img>
      )}
      {uploadProgress > 0 ? (
        <progress
          className="progress w-64 my-2"
          value={uploadProgress}
          max="100"
        ></progress>
      ) : (
        <></>
      )}
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text inline">
            <FaFileUpload className="inline mr-2"></FaFileUpload>Pick a Image
          </span>
          <span className="label-text-alt">Only .png, .jpg, jpeg accepted</span>
        </div>
        <input
          type="file"
          className="file-input file-input-bordered w-full max-w-xs"
          accept=".png,.jpg,.jpeg"
          multiple={false}
          onChange={onUpload}
        />
      </label>
    </div>
  );
}
