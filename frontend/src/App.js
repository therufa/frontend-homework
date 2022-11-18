import React, { forwardRef, useRef, useState } from "react";

const API_URL = "https://toggl-hire-frontend-homework.onrender.com/api";

function parseEmailFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    if (!file || file.type !== "text/plain") {
      return reject(new TypeError("File is not of type text"));
    }

    fileReader.addEventListener("load", (ev) => {
      resolve({
        fileName: file.name,
        emails: fileReader.result.split("\n").filter(Boolean)
      });
    });

    fileReader.readAsText(file);
  });
}

const InputForm = forwardRef((props, formRef) => {
  const { onChange, files = [] } = props;

  const handleFileChange = (e) => {
    onChange(Array.from(e.currentTarget.files));
  };

  return (
    <form ref={formRef}>
      <input
        type="file"
        accept=".txt,text/plain"
        multiple
        onChange={handleFileChange}
      />

      <ul>
        {files.map((file) => (
          <li key={file?.fileName}>{file.fileName} ({file.emails?.length ?? 0})</li>
        ))}
      </ul>

    </form>
  );
});

function App() {
  const formRef = useRef(0);
  const [files, setFiles] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [borkedEmails, setBorkedEmails] = useState([]);

  const handleSubmitBtnClick = (e) => {
    e.preventDefault();

    (async () => {
      const emails = Array.from(new Set(files.flatMap(file => file.emails)));

      setStatusMessage("Loading...");
      const response = await fetch(`${API_URL}/send`, {
        method: "POST",
        body: JSON.stringify({ emails }),
        headers: {
          'Content-type': 'application/json'
        }
      });

      formRef.current.reset();
      setFiles([]);

      if (response.status === 200) {
        setStatusMessage("Emails sent successfully!")
        return 
      }

      const json = await response.json();
      setStatusMessage(`There was an erorr: ${json.error}`)
      setBorkedEmails(json.emails);
    })();
  };

  const handleInputChange = async files => {
    setStatusMessage("");
    setBorkedEmails([]);
    setFiles(await Promise.all(files.map(parseEmailFile)));
  }

  return (
    <>
      <InputForm
        ref={formRef}
        files={files}
        onChange={handleInputChange}
      />
      <button onClick={handleSubmitBtnClick}>Send emails</button>

      <div>
        {statusMessage}
      </div>
      <ul>
        {borkedEmails?.map(email => <li key={email}>{email}</li>)}
      </ul>
    </>
  );
}

export default App;
