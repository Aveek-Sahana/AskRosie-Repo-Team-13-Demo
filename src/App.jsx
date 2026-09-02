import { useEffect, useRef, useState } from 'react'

const QUIZ_KEY = 'askrosie_quiz_session'
const WORDS_KEY = 'askrosie_rosie_words'
const ARTWORK_ID = 'rockwell-rosie-the-riveter-1943'
const quizQuestions = [
  { key: 'location', question: 'Will you mostly be inside the galleries or outside on the grounds today?', options: [['indoor', 'Inside the galleries'], ['outdoor', 'Outside on the grounds / trails'], ['mixed', 'A mix of both']] },
  { key: 'theme', question: 'What kind of art draws you in most?', options: [['nature', 'Nature & landscapes'], ['people_stories', 'People & stories'], ['contemporary', 'Bold & modern'], ['surprise_me', 'Not sure — surprise me']] },
  { key: 'time_budget', question: 'How much time do you have today?', options: [['under_1hr', 'Under an hour'], ['couple_hours', 'A couple hours'], ['all_day', 'All day']] },
  { key: 'group_type', question: "Who’s with you today?", options: [['solo', 'Just me'], ['family_kids', 'Family with kids'], ['school_group', 'A school / student group'], ['friends_date', 'Friends or a date']] },
  { key: 'experience_mode', question: 'What kind of experience are you after?', options: [['reflective', 'Calm and reflective'], ['playful', 'Fun and playful'], ['learning', 'Learn something new'], ['conversation_starter', 'Something to talk about together']] },
]
const starterWords = ['powerful', 'determined', 'strong', 'inspiring', 'bold']

function Header({ onHome }) { return <header><button className="wordmark" onClick={onHome}>AskRosie</button><span className="museum-name">Crystal Bridges · Art Companion</span></header> }
function Primary({ children, onClick, disabled = false }) { return <button className="primary" disabled={disabled} onClick={onClick}>{children}<span>→</span></button> }
function formatMessage(text) { return text.split('**').map((part, index) => index % 2 ? <strong key={index}>{part}</strong> : part) }
function getStoredQuiz() { try { const data = JSON.parse(localStorage.getItem(QUIZ_KEY)); if (!data?.completed_at || Date.now() - new Date(data.completed_at).getTime() > 8 * 60 * 60 * 1000) { localStorage.removeItem(QUIZ_KEY); return null } return data } catch { return null } }
function getWords() { try { const words = JSON.parse(localStorage.getItem(WORDS_KEY)); return Array.isArray(words) ? words : starterWords } catch { return starterWords } }

export default function App() {
  const [screen, setScreen] = useState('welcome')
  const [photo, setPhoto] = useState(null)
  const [visionImage, setVisionImage] = useState('')
  const [artwork, setArtwork] = useState(null)
  const [candidateArtwork, setCandidateArtwork] = useState(null)
  const [manualTitle, setManualTitle] = useState('')
  const [manualArtist, setManualArtist] = useState('')
  const [resolvingArtwork, setResolvingArtwork] = useState(false)
  const [resolutionError, setResolutionError] = useState('')
  const [artworkSuggestions, setArtworkSuggestions] = useState([])
  const [moderatingFeeling, setModeratingFeeling] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraRequesting, setCameraRequesting] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [quizStep, setQuizStep] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSession, setQuizSession] = useState(null)
  const [suggestion, setSuggestion] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [words, setWords] = useState(starterWords)
  const [feeling, setFeeling] = useState('')
  const [feelingDismissed, setFeelingDismissed] = useState(false)
  const [feelingStatus, setFeelingStatus] = useState('')
  const photoInput = useRef()
  const cameraVideo = useRef()
  const mediaStream = useRef(null)
  const go = (name) => { setScreen(name); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  useEffect(() => { const stored = getStoredQuiz(); if (stored) setQuizSession(stored); setWords(getWords()) }, [])
  const openCapture = () => go('capture')
  const stopCamera = () => {
    mediaStream.current?.getTracks().forEach((track) => track.stop())
    mediaStream.current = null
    if (cameraVideo.current) cameraVideo.current.srcObject = null
    setCameraReady(false)
    setCameraActive(false)
  }
  useEffect(() => {
    const video = cameraVideo.current
    const stream = mediaStream.current
    if (!cameraActive || !video || !stream) return undefined
    let cancelled = false
    const beginPreview = async () => {
      try {
        video.srcObject = stream
        await video.play()
        if (!cancelled) setCameraReady(true)
      } catch {
        if (!cancelled) setCameraError('Rosie opened the camera, but the live preview could not start. Try again or choose a photo from your device.')
      }
    }
    beginPreview()
    return () => { cancelled = true }
  }, [cameraActive])
  const startCamera = async () => {
    setCameraError('')
    setCameraReady(false)
    if (!navigator.mediaDevices?.getUserMedia) { setCameraError('This browser cannot open a live camera. Choose a photo from your device instead.'); return }
    if (!window.isSecureContext) { setCameraError('Camera access needs HTTPS on a phone. Use the secure deployed site, or choose a photo from your device.'); return }
    setCameraRequesting(true)
    try {
      stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      mediaStream.current = stream
      setCameraActive(true)
    } catch (error) {
      const message = error?.name === 'NotAllowedError' || error?.name === 'SecurityError'
        ? 'Camera access was not allowed. Allow camera access in your browser’s site settings, then try again.'
        : error?.name === 'NotFoundError'
          ? 'No camera was found on this device. Choose a photo from your device instead.'
          : error?.name === 'NotReadableError'
            ? 'Another app is using the camera. Close that app, then try again.'
            : error?.name === 'OverconstrainedError'
              ? 'Rosie could not use this camera setting. Try again to use your default camera.'
              : 'Rosie could not open the camera. Try again or choose a photo from your device.'
      setCameraError(message)
    } finally { setCameraRequesting(false) }
  }
  const prepareImageForUpload = async (file) => {
    const source = await createImageBitmap(file)
    const maxSide = 1600
    const scale = Math.min(1, maxSide / Math.max(source.width, source.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(source.width * scale))
    canvas.height = Math.max(1, Math.round(source.height * scale))
    canvas.getContext('2d', { alpha: false }).drawImage(source, 0, 0, canvas.width, canvas.height)
    source.close?.()
    const toJpeg = (quality) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    let blob = await toJpeg(0.84)
    if (blob && blob.size > 1_700_000) blob = await toJpeg(0.68)
    if (!blob || blob.size > 2_000_000) throw new Error('image_too_large')
    return new File([blob], 'rosie-artwork.jpg', { type: 'image/jpeg' })
  }
  const analyzeImageFile = async (file) => {
    if (!file?.type?.startsWith('image/')) return
    stopCamera()
    setPhoto(URL.createObjectURL(file))
    setArtwork(null)
    setCandidateArtwork(null)
    setArtworkSuggestions([])
    setManualTitle('')
    setManualArtist('')
    setFeelingDismissed(false)
    setFeelingStatus('')
    setProcessing(true)
    try {
      const uploadFile = await prepareImageForUpload(file)
      const imageDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.onerror = reject
        reader.readAsDataURL(uploadFile)
      })
      setVisionImage(imageDataUrl)
      const response = await fetch('/api/classify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageDataUrl }) })
      const result = await response.json().catch(() => ({}))
      const matchedArtwork = result.matched && result.artwork?.title && result.artwork?.artist ? result.artwork : null
      setCandidateArtwork(matchedArtwork)
      setMessages([])
      setResolutionError('')
      if (matchedArtwork) {
        setArtwork(matchedArtwork)
        go('chat')
      } else go('confirm')
    } catch {
      setVisionImage('')
      setCandidateArtwork(null)
      setMessages([])
      go('confirm')
    } finally {
      setProcessing(false)
    }
  }
  const choosePhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    await analyzeImageFile(file)
  }
  const takePhoto = async () => {
    const video = cameraVideo.current
    if (!video?.videoWidth || !video.videoHeight) { setCameraError('The camera is still getting ready. Try the shutter again in a moment.'); return }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) { setCameraError('Rosie could not capture that photo. Please try again.'); return }
    await analyzeImageFile(new File([blob], 'rosie-camera-photo.jpg', { type: 'image/jpeg' }))
  }
  useEffect(() => () => { mediaStream.current?.getTracks().forEach((track) => track.stop()) }, [])
  const confirmCandidate = () => {
    if (!candidateArtwork) return
    setArtwork(candidateArtwork)
    setMessages([])
    go('chat')
  }
  const enterArtworkManually = async (event) => {
    event.preventDefault()
    if (!manualTitle.trim() || resolvingArtwork) return
    setResolvingArtwork(true)
    setResolutionError('')
    try {
      const response = await fetch('/api/resolve-artwork', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: manualTitle, artist: manualArtist }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error('not found')
      if (result.found && result.artwork) {
        setCandidateArtwork(result.artwork)
        setArtworkSuggestions([])
        setResolutionError('')
        return
      }
      setArtworkSuggestions(result.suggestions || [])
      setResolutionError(result.suggestions?.length ? 'Rosie found a few possible spellings. Is one of these the work you mean?' : 'Rosie couldn’t find a close title yet. Try a few words from the wall label, or add the artist.')
    } catch { setResolutionError('Rosie couldn’t check that title right now. Try again in a moment.') } finally { setResolvingArtwork(false) }
  }
  const chooseArtworkSuggestion = (suggestion) => {
    setCandidateArtwork(suggestion)
    setArtworkSuggestions([])
    setResolutionError('')
  }
  const answerQuiz = async (value) => {
    const question = quizQuestions[quizStep]; const next = { ...quizAnswers, [question.key]: value }; setQuizAnswers(next)
    if (quizStep < quizQuestions.length - 1) return setQuizStep(quizStep + 1)
    const session = { ...next, completed_at: new Date().toISOString() }; localStorage.setItem(QUIZ_KEY, JSON.stringify(session)); setQuizSession(session); setSuggesting(true); go('suggestion')
    try { const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'quiz', quizAnswers: session, messages: [{ role: 'user', content: 'Please create my personalized starting suggestion.' }] }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSuggestion(data.reply) } catch { setSuggestion('Rosie is taking a short breath. Please try that once more in a moment.') } finally { setSuggesting(false) }
  }
  const skipQuiz = () => { setQuizSession(null); go('capture') }
  const startOver = () => { localStorage.removeItem(QUIZ_KEY); setQuizSession(null); setQuizAnswers({}); setQuizStep(0); setSuggestion(''); go('quiz') }
  const sendMessage = async (event, quickText) => {
    event?.preventDefault(); const text = quickText || draft.trim(); if (!text || sending) return
    const next = [...messages, { role: 'user', content: text }]; setMessages(next); setDraft(''); setSending(true); setFeelingDismissed(true)
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'artwork', messages: next, imageDataUrl: visionImage, identifiedArtwork: artwork }) })
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Connection error') }
      if (!response.body) throw new Error('The response stream was unavailable.')
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let answer = ''
      while (true) {
        const { value, done } = await reader.read(); if (done) break
        buffer += decoder.decode(value, { stream: true }); const events = buffer.split('\n\n'); buffer = events.pop() || ''
        for (const eventText of events) {
          const payload = eventText.split('\n').find((line) => line.startsWith('data:'))?.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          const event = JSON.parse(payload)
          if (event.error) throw new Error(event.error)
          const delta = event.delta || ''
          if (!delta) continue
          answer += delta
          setSending(false)
          setMessages([...next, { role: 'assistant', content: answer }])
        }
      }
      if (!answer) throw new Error('The service returned an empty response.')
    } catch { setMessages([...next, { role: 'assistant', content: 'Rosie is taking a short breath. Please try that once more in a moment.' }]) } finally { setSending(false) }
  }
  const addFeeling = async (candidate) => {
    const word = (candidate || feeling).toLowerCase().trim().replace(/[^a-z-]/g, '').slice(0, 24)
    if (!word || moderatingFeeling) { if (!word) setFeelingStatus('Choose one word to share.'); return }
    setModeratingFeeling(true)
    setFeelingStatus('Rosie is checking that word…')
    try {
      const response = await fetch('/api/moderate-word', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result.allowed !== true) { setFeelingStatus(result.reason || 'That word isn’t right for a school artwork space, so Rosie didn’t add it.'); return }
      const next = [...words, word]; localStorage.setItem(WORDS_KEY, JSON.stringify(next)); setWords(next); setFeeling(''); setFeelingStatus(`“${word}” joined the cloud.`); setTimeout(() => setFeelingDismissed(true), 1400)
    } catch { setFeelingStatus('Rosie couldn’t check that word right now, so it wasn’t added.') } finally { setModeratingFeeling(false) }
  }
  const shell = (content) => <main className={`app-shell ${screen}`}><Header onHome={() => { stopCamera(); go('welcome') }} />{content}<p className="demo-notice">This application is for demo purposes only.</p><input ref={photoInput} className="file-input" type="file" accept="image/*" onChange={choosePhoto}/></main>

  if (screen === 'welcome') return shell(<section className="welcome-new"><span className="eyebrow">Your museum, in conversation</span><h1>Meet art with<br/><em>Rosie.</em></h1><p>Photograph an artwork, follow your curiosity, and discover a little more together.</p><div className="welcome-actions"><Primary onClick={() => quizSession ? go('capture') : go('quiz')}>{quizSession ? 'Continue your visit' : 'Personalize my visit'}</Primary><button className="text-button" onClick={skipQuiz}>Skip to artwork chat →</button></div><p className="privacy-note">No tracking user data. Insights on artwork may be referred to other guests.</p></section>)
  if (screen === 'quiz') { const q = quizQuestions[quizStep]; return shell(<section className="quiz"><div className="quiz-top"><span className="eyebrow">A quick visit quiz · {quizStep + 1} of 5</span><button className="text-button" onClick={skipQuiz}>Skip for now</button></div><div className="quiz-progress"><i style={{ width: `${((quizStep + 1) / 5) * 100}%` }}/></div><h1>{q.question}</h1><div className="quiz-options">{q.options.map(([value, label], index) => <button key={value} onClick={() => answerQuiz(value)}><b>{String.fromCharCode(65 + index)}</b><span>{label}</span><i>→</i></button>)}</div><p className="privacy-note">Optional and saved only in your browser.</p></section>) }
  if (screen === 'suggestion') return shell(<section className="suggestion"><span className="eyebrow">A starting point for your visit</span>{suggesting ? <div className="suggestion-loading"><i/><i/><i/><p>Rosie is finding your first stop…</p></div> : <><h1>Here’s where I’d begin.</h1><p>{formatMessage(suggestion)}</p><RoutePlan answers={quizSession}/><Primary onClick={openCapture}>Find an artwork</Primary><button className="text-button" onClick={startOver}>Start quiz over</button></>}</section>)
  if (screen === 'capture') return shell(<section className="capture"><button className="back" onClick={() => { stopCamera(); go('welcome') }}>← <span>Home</span></button><div className="capture-heading"><span className="eyebrow">Artwork finder</span><h1>Show Rosie the artwork.</h1><p>Use your camera live, or choose a photo already on this device.</p></div><div className={`camera-stage ${processing ? 'processing' : ''}`}><div className={`viewfinder ${cameraActive ? 'camera-live' : ''}`}><video ref={cameraVideo} className={cameraActive ? '' : 'camera-video-hidden'} autoPlay playsInline muted aria-label="Live camera preview"/>{cameraActive ? <span className={`camera-status ${cameraReady ? 'ready' : ''}`}>{cameraReady ? 'Camera ready' : 'Connecting to camera…'}</span> : photo ? <img src={photo} alt="Selected artwork"/> : <><span className="corner tl"/><span className="corner tr"/><span className="corner bl"/><span className="corner br"/><RosieMark/></>}</div>{processing && <div className="analyzing"><span>Rosie is identifying the artwork…</span><i/></div>}{cameraError && <p className="camera-error" role="alert">{cameraError}</p>}</div><div className="capture-actions">{cameraActive ? <><button className="camera-btn shutter" disabled={!cameraReady} onClick={takePhoto} aria-label="Take photo"><i/></button><button className="text-button" onClick={stopCamera}>Stop camera</button></> : <><button className="camera-btn" disabled={cameraRequesting} onClick={startCamera} aria-label="Open camera">⌾</button><div className="capture-choice-row"><button className="outline-button" disabled={cameraRequesting} onClick={startCamera}>{cameraRequesting ? 'Opening camera…' : 'Take a photo'}</button><button className="outline-button" onClick={() => photoInput.current?.click()}>Choose from device</button></div></>}</div></section>)
  if (screen === 'confirm') return shell(<ArtworkConfirmation photo={photo} candidate={candidateArtwork} suggestions={artworkSuggestions} onSuggestion={chooseArtworkSuggestion} onYes={confirmCandidate} onNo={() => { setCandidateArtwork(null); setArtworkSuggestions([]); setResolutionError('') }} manualTitle={manualTitle} setManualTitle={setManualTitle} manualArtist={manualArtist} setManualArtist={setManualArtist} resolving={resolvingArtwork} error={resolutionError} onSubmit={enterArtworkManually} onNewArtwork={openCapture}/>)
  return shell(<Chat photo={photo} artwork={artwork} messages={messages} draft={draft} setDraft={setDraft} sending={sending} sendMessage={sendMessage} words={words} feeling={feeling} setFeeling={setFeeling} addFeeling={addFeeling} feelingDismissed={feelingDismissed} setFeelingDismissed={setFeelingDismissed} feelingStatus={feelingStatus} moderatingFeeling={moderatingFeeling} onNewArtwork={openCapture} onStartOver={startOver} />)
}

function ArtworkConfirmation({ photo, candidate, suggestions, onSuggestion, onYes, onNo, manualTitle, setManualTitle, manualArtist, setManualArtist, resolving, error, onSubmit, onNewArtwork }) { return <section className="artwork-confirmation"><button className="back" onClick={onNewArtwork}>← <span>New photo</span></button><div className="confirm-card">{photo && <img src={photo} alt="Uploaded artwork"/>}<div><span className="eyebrow">Artwork check</span>{candidate ? <><h1>Is this artwork <em>{candidate.title}</em>?</h1><p>{candidate.artist}{candidate.date ? ` · ${candidate.date}` : ''}</p><div className="confirm-actions"><Primary onClick={onYes}>Yes, that’s it</Primary><button className="outline-button" onClick={onNo}>No, help me find it</button></div></> : <><h1>What words can you read on the wall label?</h1><p>Type it your way—even just a few words. Rosie will help match the spelling and artist to the official Crystal Bridges record.</p></>} {!candidate && <form className="artwork-form" onSubmit={onSubmit}><input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="A few title words are enough" aria-label="Artwork title" required/><input value={manualArtist} onChange={(e) => setManualArtist(e.target.value)} placeholder="Artist, if you know it (optional)" aria-label="Artist"/><button className="primary" disabled={resolving}>{resolving ? 'Rosie is checking…' : 'Help me find it'} <span>→</span></button>{error && <p className="resolve-error">{error}</p>}{suggestions.length > 0 && <div className="artwork-suggestions"><span>Possible matches</span>{suggestions.map((work) => <button type="button" key={work.slug} onClick={() => onSuggestion(work)}><b><em>{work.title}</em></b><small>{work.artist}{work.date ? ` · ${work.date}` : ''}</small></button>)}</div>}</form>}</div></div></section> }
function RoutePlan({ answers }) {
  const outdoor = answers?.location === 'outdoor'
  const focus = answers?.theme === 'people_stories' ? 'American Voices or Stories of U.S.' : answers?.theme === 'contemporary' ? 'Innovation and the Arts or Keith Haring in 3D' : answers?.theme === 'nature' ? 'a staff-confirmed outdoor route' : 'Cabinet of Curiosities or Looking Closer'
  return <section className="route-plan"><div><h3>{outdoor ? 'A verified indoor anchor before you head outside' : 'Use the map as your orientation guide'}</h3></div><ol><li><b>Start</b><span>Main Entrance</span></li><li><b>Orient</b><span>Great Hall → North Landing</span></li><li><b>Explore</b><span>{focus}</span></li></ol><details><summary>View the supplied school-program map</summary><div className="map-tabs"><figure><img src="/crystal-bridges-lobby-map.png" alt="Crystal Bridges School Programs Tour Artwork Map, Lobby Level"/><figcaption>Lobby Level</figcaption></figure><figure><img src="/crystal-bridges-bridge-map.png" alt="Crystal Bridges School Programs Tour Artwork Map, Bridge Level"/><figcaption>Bridge Level</figcaption></figure></div><a href="/crystal-bridges-school-program-map.pdf" target="_blank" rel="noreferrer">Open the original PDF ↗</a></details></section>
}
function RosieMark(){ return <div className="rosie-mark"><i/><i/><i/></div> }
function Feelings({ feeling, setFeeling, addFeeling, dismissed, setDismissed, status, moderating }) { if (dismissed) return null; return <section className="feelings-card"><div><h3>How does this artwork make you feel?</h3></div><div className="feeling-actions"><input value={feeling} maxLength={24} disabled={moderating} onChange={(e) => setFeeling(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addFeeling()} placeholder="Your word"/><button disabled={moderating} onClick={() => addFeeling()} aria-label="Add feeling">+</button></div><div className="suggested-feelings">{['powerful','curious','unsettled','joyful'].map((word) => <button disabled={moderating} key={word} onClick={() => addFeeling(word)}>{word}</button>)}</div><button className="dismiss-feeling" onClick={() => setDismissed(true)}>Not now</button>{status && <p className="feeling-status">{status}</p>}</section> }
function WordCloud({ words }) { const counts = words.reduce((all, word) => ({ ...all, [word]: (all[word] || 0) + 1 }), {}); const cloud = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 8); return <section className="community"><div className="community-head"><h3>Other people describe this work as…</h3></div>{cloud.length >= 3 ? <div className="word-cloud">{cloud.map(([word,count], index) => <span key={word} className={`word size-${Math.min(count, 3)}`} style={{ animationDelay: `${index * 90}ms` }}>{word}</span>)}</div> : <p>Be the first to share how this makes you feel.</p>}</section> }
function AssistantAvatar({ typing = false }) { return <div className={`avatar rosie-message-avatar${typing ? ' is-typing' : ''}`}><img src="/rosie-avatar.png" alt="Rosie"/></div> }
function Chat({ photo, artwork, messages, draft, setDraft, sending, sendMessage, words, feeling, setFeeling, addFeeling, feelingDismissed, setFeelingDismissed, feelingStatus, moderatingFeeling, onNewArtwork, onStartOver }) { return <section className="chat-layout"><aside className="art-summary"><button className="back" onClick={onNewArtwork}>← <span>New photo</span></button>{photo && <img src={photo} alt="Uploaded artwork"/>}<h2>{artwork?.title || 'Artwork not yet identified'}</h2><p><em>{artwork?.artist || 'Ask Rosie what you notice'}</em></p><button className="outline-button" onClick={onStartOver}>Start visit quiz over</button><WordCloud words={words}/></aside><section className="conversation"><div className="conversation-head"><div className="conversation-title"><div className="rosie-avatar-wrap"><img className="rosie-avatar" src="/rosie-avatar.png" alt="Illustrated Rosie"/></div><div><span className="eyebrow">AskRosie</span><h1>Let’s look closer.</h1></div></div></div><Feelings feeling={feeling} setFeeling={setFeeling} addFeeling={addFeeling} dismissed={feelingDismissed} setDismissed={setFeelingDismissed} status={feelingStatus} moderating={moderatingFeeling}/><div className="message-list">{messages.map((message,index) => <div key={index} className={`message ${message.role}`}>{message.role === 'assistant' ? <AssistantAvatar/> : <div className="avatar">You</div>}<p>{formatMessage(message.content)}</p></div>)}{sending && <div className="message assistant typing-message"><AssistantAvatar typing/><p className="typing" aria-label="Rosie is typing"><i/><i/><i/></p></div>}</div><div className="quick-prompts"><button onClick={(e) => sendMessage(e, 'What details should I notice in this artwork?')}>Details to notice</button><button onClick={(e) => sendMessage(e, 'What feels important about this work?')}>What feels important</button><button onClick={(e) => sendMessage(e, 'What does the official record say about this artwork?')}>Official context</button></div><form className="chat-form" onSubmit={sendMessage}><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="AskRosie about this artwork…" aria-label="Your question"/><button disabled={!draft.trim() || sending}>Send <span>↑</span></button></form></section></section> }
