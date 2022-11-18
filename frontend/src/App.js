import React, { forwardRef, useRef, useState } from "react";

const API_URL = "https://toggl-hire-frontend-homework.onrender.com/api";

function parseEmailFile(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    if (!file || file.type !== "text/plain") {
      return reject(new TypeError(`File ${file.name} is not of type text`));
    }

    fileReader.addEventListener("load", () => {
      // since there's email pattern validation on the backend I choose not to
      // do it but here would be the place, but it would introduce a number of
      // UI/UX issues, I'm not sure how to handle.
      resolve({
        fileName: file.name,
        emails: fileReader.result.split("\n").filter(Boolean),
      });
    });

    fileReader.readAsText(file);
  });
}

function submitJson(resource, body) {
  return fetch(`${API_URL}/${resource}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-type": "application/json",
    },
  });
}

function prettyErrorMessages(errKey) {
  return (
    {
      send_failure: "Failed to send to some addresses",
      server_error: "Unexpected server error",
      invalid_request_body: "Better luck next time",
    }[errKey] ?? errKey
  );
}

function fileArrayFromDataTransfer(dataTransfer) {
  if (dataTransfer.items) {
    return Array.from(dataTransfer.items).reduce((files, item) => {
      if (item.kind === 'file') {
        return [...files, item.getAsFile()];
      }

      return files;
    }, []);
  }

  return Array.from(dataTransfer.files);
}

const InputForm = forwardRef((props, formRef) => {
  const { onChange, onSubmit, files = [], statusMessage, borkedEmails } = props;

  const handleFileChange = (e) => {
    onChange(Array.from(e.currentTarget.files));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    onSubmit();
  };

  const handleFileDrop = (e) => {
    e.preventDefault();

    const files = fileArrayFromDataTransfer(e.dataTransfer);
    onChange(files);
  };

  const handleFileDrag = (e) => {
    // prevent default browser behaviour
    e.preventDefault();
  };

  return (
    <form ref={formRef} onSubmit={handleFormSubmit} onDrop={handleFileDrop} onDragOver={handleFileDrag} className="email-form">
      <div className="email-form__form-body">
        <input
          type="file"
          accept=".txt,text/plain"
          multiple
          onChange={handleFileChange}
        />

        <ul>
          {files.map((file) => (
            <li key={file?.fileName}>
              {file.fileName} ({file.emails?.length ?? 0})
            </li>
          ))}
        </ul>

        <button type="submit">Send emails</button>
      </div>

      <div className="email-form__status-message">
        {statusMessage}

        <ul>
          {borkedEmails?.map((email) => (
            <li key={email}>{email}</li>
          ))}
        </ul>
      </div>
    </form>
  );
});

function App() {
  const formRef = useRef(0);
  const [files, setFiles] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [borkedEmails, setBorkedEmails] = useState([]);

  const resetState = () => {
    setStatusMessage("");
    setBorkedEmails([]);
    setFiles([]);
  };

  const handleFormSubmit = async () => {
    if (files.length === 0) {
      resetState();
      setStatusMessage("You shouldn't send an empty list. Should you?");
      return;
    }

    setStatusMessage("Loading...");

    const emails = Array.from(new Set(files.flatMap((file) => file.emails)));
    try {
      const response = await submitJson("send", { emails });

      formRef.current.reset();
      setFiles([]);

      if (response.status === 200) {
        setStatusMessage("Emails sent successfully!");
        return;
      }

      const json = await response.json();
      setStatusMessage(
        `There was an error: ${prettyErrorMessages(json.error)}`
      );
      setBorkedEmails(json.emails);
    } catch (e) {
      setStatusMessage(
        "There was an unexpected error. Either you, or the API is offline"
      );
    }
  };

  const handleInputChange = async (files) => {
    resetState();

    try {
      setFiles(await Promise.all(files.map(parseEmailFile)));
    } catch (err) {
      setStatusMessage(err.message);
    }
  };

  return (
    <InputForm
      ref={formRef}
      files={files}
      onChange={handleInputChange}
      onSubmit={handleFormSubmit}
      statusMessage={statusMessage}
      borkedEmails={borkedEmails}
    />
  );
}

export default App;
