import React, { useRef, useState } from "react";

const API_URL = "https://toggl-hire-frontend-homework.onrender.com/api";

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    if (!file || file.type !== "text/plain") {
      return reject(new TypeError("File is not of type text"));
    }

    fileReader.addEventListener("load", (ev) => {
      resolve(fileReader.result);
    });

    fileReader.readAsText(file);
  });
}

function parseEmailList(fileContentList) {
  const emailList = fileContentList
    .reduce(
      (emails, rawList) => [...emails, rawList.split("\n").filter(Boolean)],
      []
    )
    .flat();

  // Convert it to set in order to de-duplicate contents
  const emailSet = new Set(emailList);

  return Array.from(emailSet);
}

function InputForm({ onChange }) {
  const handleFileChange = (e) => {
    onChange(Array.from(e.currentTarget.files));
  };

  return (
    <input
      type="file"
      accept=".txt,text/plain"
      multiple
      onChange={handleFileChange}
    />
  );
}

function App() {
  const formRef = useRef(0);
  const [files, setFiles] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [borkedEmails, setBorkedEmails] = useState([]);

  const handleSubmitBtnClick = (e) => {
    e.preventDefault();

    (async () => {
      const fileContentList = await Promise.all(files.map(readFileText));
      const emails = parseEmailList(fileContentList);

      const response = await fetch(`${API_URL}/send`, {
        method: "POST",
        body: JSON.stringify({ emails }),
        headers: {
          'Content-type': 'application/json'
        }
      });

      formRef.current.reset();
      setFiles([]);
      setStatusMessage("Loading...");

      if (response.status === 200) {
        setStatusMessage("Emails sent successfully!")
        return 
      }

      const json = await response.json();
      setStatusMessage(`There was an erorr: ${json.error}`)
      setBorkedEmails(json.emails);
    })();
  };

  const handleInputChange = files => {
    setStatusMessage("");
    setBorkedEmails([]);
    setFiles(files);
  }

  return (
    <form ref={formRef}>
      <InputForm onChange={handleInputChange} />
      <ul>
        {files.map((file) => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>

      <button onClick={handleSubmitBtnClick}>Send emails</button>

      <div>
        {statusMessage}
      </div>
      <ul>
        {borkedEmails?.map(email => <li key={email}>{email}</li>)}
      </ul>
    </form>
  );
}

export default App;
