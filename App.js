import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file for styling

function App() {
    const [message, setMessage] = useState("");
    const [files, setFiles] = useState([]); // Handle multiple files
    const [fileNames, setFileNames] = useState(""); // Show multiple file names
    const [chatResponse, setChatResponse] = useState("");
    const [uploading, setUploading] = useState(false);
    
    const backendUrl = 'http://10.48.27.42:5000'; // Set the backend URL

    const handleTextInputChange = (e) => {
        setMessage(e.target.value);
    };

    const handleFileUpload = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
        setFileNames(selectedFiles.length > 0 ? selectedFiles.map(file => file.name).join(', ') : "");
    };

    const handleSendMessage = async () => {
        setUploading(true);
        setChatResponse("");

        if (message.trim() && files.length === 0) {
            try {
                const response = await axios.post(`${backendUrl}/chat`, { message }); // Use backend URL
                setChatResponse(response.data.response);
            } catch (error) {
                console.error("There was an error sending the message!", error);
                setChatResponse("Error sending message");
            }
        } else if (files.length > 0) {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });
            formData.append('message', message);
            formData.append('fileCount', files.length); // Send the number of files

            try {
                const response = await axios.post(`${backendUrl}/upload`, formData, { // Use backend URL
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setChatResponse(response.data.responses.map(res => `${res.filename}: ${res.response}`).join('\n\n'));
            } catch (error) {
                console.error("There was an error uploading the file(s)!", error);
                setChatResponse("Error uploading file(s)");
            }
        } else {
            setChatResponse("Please provide a text message or upload files.");
        }

        setUploading(false);
    };

    const handleClear = () => {
        setMessage("");
        setFiles([]);
        setFileNames("");
        setChatResponse("");
    };

    return (
        <div className="App">
            <div className="Heading">
                <h1>Custom Trained AI Chatbot</h1>
            </div>
            <div className="chat-container">
            <div className="response-container">
                    <h2> </h2>
                    <div className="response-box">
                        {chatResponse ? (
                        <p>{chatResponse}</p>
                                        ) : (
                            <p style={{ color: 'gray' }}>Output</p> // Display "Output" in gray when there's no response
                                            )}
                    </div>
                    </div>
                <h2> </h2>
                <div className="input-container">
                    <textarea
                        value={message}
                        onChange={handleTextInputChange}
                        placeholder="Ask me anything or describe the file content"
                        className="text-input"
                    />
                    <div className="buttons-container">
                        <label htmlFor="file-input" className="file-label">
                            <input
                                type="file"
                                id="file-input"
                                accept="image/*, .pdf, .csv, video/*, audio/*, application/xml, text/xml, *"
                                onChange={handleFileUpload}
                                className="file-input"
                                multiple // Allow multiple file selection
                            />
                            {fileNames ? `Files: ${fileNames}` : 'Select Files'}
                        </label>
                        <button
                            onClick={handleSendMessage}
                            disabled={uploading}
                            className="send-button"
                        >
                            {uploading ? <div className="spinner"></div> : 'Send'}
                        </button>
                        <button
                            onClick={handleClear}
                            className="clear-button"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
