import React, { useState } from 'react';

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    if (!file || file.type !== 'text/plain') {
      return reject(new TypeError('File is not of type text'));
    }

    fileReader.addEventListener('load', (ev) => {
      resolve(fileReader.result)
    })

    fileReader.readAsText(file)
  })
}


function InputForm({ onChange }) {
  const handleFileChange = (e) => {
    onChange(Array.from(e.currentTarget.files));
  }

  return (
    <input type="file" onChange={handleFileChange} />
  )
}

function App() {
  const [files, setFiles] = useState([]);
  const [emailList, setEmailList] = useState([]);

  const handlePrintContents = async () => {
    const fileContentList = (await Promise.all(files.map(readFileText)))
    const emailList = fileContentList.reduce((emails, rawList) =>
      [...emails, rawList.split('\n').filter(Boolean)], []
    ).flat()
    
    setEmailList(emailList)
  }

  return (
    <>
      <InputForm onChange={setFiles} />
      <ul>
        {files.map(file => <li key={file}>{file.name}</li>)}
      </ul>

      <button onClick={handlePrintContents}>print content</button>

      <ul>
        {emailList.map(email => <li key={email}>{email}</li>)}
      </ul>
    </>
  );
}

export default App;
