"use client"

import { useState, useRef } from "react"
import { Mic, Square, Upload, Loader, FileText } from "lucide-react"

const AudioProcessor = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcript, setTranscript] = useState("")
  const [summary, setSummary] = useState("")
  const [tasks, setTasks] = useState([])
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [transcriptId, setTranscriptId] = useState(null)

  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])

  const startRecording = async () => {
    setIsRecording(true)
    audioChunks.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data)
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
      }

      mediaRecorder.current.start()
    } catch (err) {
      setError("Error starting recording. Please check microphone permissions.")
      console.error("Error:", err)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop()
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setAudioBlob(file)
  }

  const processAudio = async () => {
    if (!audioBlob) {
      setError("No audio file to process.")
      return
    }

    setIsLoading(true)
    setError("")
    setTranscript("")
    setSummary("")
    setTasks([])
    setEvents([])
    setTranscriptId(null)

    const formData = new FormData()
    formData.append("audio", audioBlob)

    try {
      const uploadResponse = await fetch("http://localhost:5000/api/uploads/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`)
      }

      const uploadData =await uploadResponse.json()
      console.log(uploadData);
      setTranscriptId(uploadData.id)

      const transcriptResponse = uploadData.transcript;
      
      setTranscript(transcriptResponse|| "")

      
      const summaryData = uploadData.summary;
      setSummary(summaryData || "")

    

      setError("")
    } catch (err) {
      setError("Error processing audio. Please try again.")
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const processTranscript = async () => {
    if (!transcriptId) return

    try {
      await fetch(`http://localhost:5000/api/uploads/transcription/${transcriptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })

      const taskResponse = (await fetch(`http://localhost:5000/api/uploads/extract-tasks/${transcriptId}`, { method: "POST" }));

      const eventsResponse = await fetch(`http://localhost:5000/api/uploads/events/${transcriptId}`)

      const tr = await taskResponse.json();
      const er = await eventsResponse.json();
      
      
      const taskData = tr.tasks;
      const eventData = er.events;
      console.log(taskData);
      console.log(eventData);
      setTasks(taskData || [])
      setEvents(eventData || [])
      console.log(tasks);
      console.log(events);  
      setError("")
    } catch (err) {
      setError("Error processing transcript. Please try again.")
      console.error("Error:", err)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Audio Processor</h2>

        {/* Recording/Upload Controls */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              isRecording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-5 h-5" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" /> Start Recording
              </>
            )}
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg cursor-pointer">
            <Upload className="w-5 h-5" />
            Upload Audio
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Process Buttons */}
        {audioBlob && !isLoading && (
          <button
            onClick={processAudio}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            Process Audio
          </button>
        )}

        {/* Process Transcript Button */}
        {transcriptId && (
          <button
            onClick={processTranscript}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mt-4"
          >
            <FileText className="w-5 h-5" /> Process Transcript
          </button>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader className="w-5 h-5 animate-spin" /> Processing...
          </div>
        )}

        {/* Error Message */}
        {error && <div className="text-red-500 mt-2">{error}</div>}

        {/* Results */}
        {transcript && (
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Transcript</h3>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full h-40 p-3 border rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Summary</h3>
              <p className="p-3 bg-gray-50 rounded-lg">{summary}</p>
            </div>
          </div>
        )}

        {/* Tasks */}
       {tasks && tasks.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Tasks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <div key={task._id} className="bg-white border rounded-lg shadow p-4">
                  <h4 className="font-semibold text-lg mb-2">{task.title || "Untitled Task"}</h4>
                  <p className="text-sm text-gray-600 mb-2">{task.description || "No description"}</p>
                  <div className="flex justify-between text-sm">
                    <span>Due: {formatDate(task.due_date)}</span>
                    <span className="capitalize">{task.priority || "No priority"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events */}
        {events && events.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <div key={event._id} className="bg-white border rounded-lg shadow p-4">
                  <h4 className="font-semibold text-lg mb-2">{event.title || "Untitled Event"}</h4>
                  <p className="text-sm text-gray-600 mb-2">{event.description || "No description"}</p>
                  <div className="flex justify-between text-sm">
                    <span>Start: {formatDate(event.start_time)}</span>
                    <span>End: {formatDate(event.end_time)}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="capitalize">{event.priority || "No priority"}</span>
                    {event.recurrence && <span className="ml-2">Recurrence: {event.recurrence}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AudioProcessor

