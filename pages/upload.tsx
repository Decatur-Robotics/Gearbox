import React, { useState } from 'react';

export default function Upload() {

  const onSubmit = async(event: any) => {
    const data = event.target.files[0];
    const formData = new FormData();
    formData.append('files', data);

    const res = await fetch('/api/img/upload', {
        method: 'POST',
        body: formData,
    });
    
    console.log(await res.json())

  };

  return (
    <form>
      <input type="file" accept=".png,.jpg,.jpeg" multiple={false} onChange={onSubmit} />
      <input type='submit'></input>
    </form>
  );
}